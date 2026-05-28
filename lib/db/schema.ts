import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  district: text("district").notNull(),
  city: text("city").notNull().default("서울"),
  stage: text("stage").notNull().default("정비구역지정"),
  estimatedMoveIn: text("estimated_move_in"),
  estimatedHouseholds: integer("estimated_households"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
});

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),
  buildingName: text("building_name"),
  areaPyeong: real("area_pyeong").notNull(),
  areaSqm: real("area_sqm").notNull(),
  yearBuilt: integer("year_built"),
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  price: integer("price").notNull(),
  pricePerPyeong: integer("price_per_pyeong").notNull(),
  transactionType: text("transaction_type").notNull().default("호가"),
  surveyDate: text("survey_date"),
  source: text("source"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),
  buildingName: text("building_name"),
  areaPyeong: real("area_pyeong").notNull(),
  areaSqm: real("area_sqm").notNull(),
  yearBuilt: integer("year_built"),
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  askingPrice: integer("asking_price").notNull(),
  askingPricePerPyeong: integer("asking_price_per_pyeong").notNull(),
  assessedPrice: integer("assessed_price"),
  priceGapPercent: real("price_gap_percent"),
  verdict: text("verdict"),
  matchedSurveyCount: integer("matched_survey_count"),
  source: text("source"),
  status: text("status").notNull().default("검토중"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
});

export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
