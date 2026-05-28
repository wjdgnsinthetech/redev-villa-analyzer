#!/bin/bash
# 로컬 SQLite → Turso 마이그레이션 스크립트
# 사용법: ./scripts/migrate-to-turso.sh <turso-db-name>

set -e

DB_NAME=${1:-"redev-villa-analyzer"}
LOCAL_DB="./data/redev.db"

if [ ! -f "$LOCAL_DB" ]; then
  echo "❌ 로컬 DB를 찾을 수 없습니다: $LOCAL_DB"
  exit 1
fi

echo "📤 로컬 DB를 Turso로 마이그레이션합니다..."
echo "   DB 이름: $DB_NAME"
echo "   로컬 파일: $LOCAL_DB"
echo ""

# 로컬 DB를 SQL 덤프로 내보내기
echo "1/3. SQL 덤프 생성 중..."
sqlite3 "$LOCAL_DB" .dump > /tmp/redev-dump.sql
echo "   ✅ 덤프 완료 ($(wc -l < /tmp/redev-dump.sql) lines)"

# Turso DB에 SQL 덤프 밀어넣기
echo "2/3. Turso DB에 데이터 밀어넣기..."
turso db shell "$DB_NAME" < /tmp/redev-dump.sql
echo "   ✅ 데이터 이전 완료"

# 검증
echo "3/3. 데이터 검증..."
echo "   Turso DB 테이블:"
turso db shell "$DB_NAME" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
echo ""
echo "   레코드 수:"
turso db shell "$DB_NAME" "SELECT 'zones: ' || count(*) FROM zones;"
turso db shell "$DB_NAME" "SELECT 'surveys: ' || count(*) FROM surveys;"
turso db shell "$DB_NAME" "SELECT 'listings: ' || count(*) FROM listings;"

# 정리
rm -f /tmp/redev-dump.sql
echo ""
echo "🎉 마이그레이션 완료!"
echo ""
echo "다음 환경변수를 설정하세요:"
turso db show "$DB_NAME" --url
echo ""
echo "토큰 생성:"
echo "  turso db tokens create $DB_NAME"
