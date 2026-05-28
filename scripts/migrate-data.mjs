// 로컬 SQLite → Turso 데이터 마이그레이션 스크립트
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDbPath = path.join(__dirname, "..", "data", "redev.db");

// 로컬 SQLite 연결
const local = new Database(localDbPath, { readonly: true });

// Turso 연결
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("🚀 데이터 마이그레이션 시작...\n");

  // 1. zones 테이블
  const zones = local.prepare("SELECT * FROM zones").all();
  console.log(`📦 zones: ${zones.length}건`);

  for (const zone of zones) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO zones (id, name, district, city, stage, estimated_move_in, estimated_households, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        zone.id, zone.name, zone.district, zone.city, zone.stage,
        zone.estimated_move_in, zone.estimated_households, zone.notes,
        zone.created_at, zone.updated_at,
      ],
    });
  }
  console.log("   ✅ zones 완료");

  // 2. surveys 테이블 (배치로 처리)
  const surveys = local.prepare("SELECT * FROM surveys").all();
  console.log(`📦 surveys: ${surveys.length}건`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < surveys.length; i += BATCH_SIZE) {
    const batch = surveys.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((s) => ({
      sql: `INSERT OR REPLACE INTO surveys (id, zone_id, building_name, area_pyeong, area_sqm, year_built, floor, total_floors, price, price_per_pyeong, transaction_type, survey_date, source, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.id, s.zone_id, s.building_name, s.area_pyeong, s.area_sqm,
        s.year_built, s.floor, s.total_floors, s.price, s.price_per_pyeong,
        s.transaction_type, s.survey_date, s.source, s.notes,
        s.created_at, s.updated_at,
      ],
    }));
    await turso.batch(stmts);
    process.stdout.write(`   ${Math.min(i + BATCH_SIZE, surveys.length)}/${surveys.length} `);
  }
  console.log("\n   ✅ surveys 완료");

  // 3. listings 테이블
  const listings = local.prepare("SELECT * FROM listings").all();
  console.log(`📦 listings: ${listings.length}건`);

  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((l) => ({
      sql: `INSERT OR REPLACE INTO listings (id, zone_id, building_name, area_pyeong, area_sqm, year_built, floor, total_floors, asking_price, asking_price_per_pyeong, assessed_price, price_gap_percent, verdict, matched_survey_count, source, status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        l.id, l.zone_id, l.building_name, l.area_pyeong, l.area_sqm,
        l.year_built, l.floor, l.total_floors, l.asking_price, l.asking_price_per_pyeong,
        l.assessed_price, l.price_gap_percent, l.verdict, l.matched_survey_count,
        l.source, l.status, l.notes, l.created_at, l.updated_at,
      ],
    }));
    await turso.batch(stmts);
  }
  console.log("   ✅ listings 완료");

  // 검증
  const [zc] = (await turso.execute("SELECT count(*) as c FROM zones")).rows;
  const [sc] = (await turso.execute("SELECT count(*) as c FROM surveys")).rows;
  const [lc] = (await turso.execute("SELECT count(*) as c FROM listings")).rows;

  console.log(`\n🎉 마이그레이션 완료!`);
  console.log(`   Turso zones: ${zc.c}건`);
  console.log(`   Turso surveys: ${sc.c}건`);
  console.log(`   Turso listings: ${lc.c}건`);

  turso.close();
  local.close();
}

migrate().catch((err) => {
  console.error("❌ 마이그레이션 실패:", err);
  process.exit(1);
});
