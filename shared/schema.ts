import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const urls = pgTable("urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  name: text("name"),
  status: text("status", { enum: ["online", "warning", "offline", "pending"] }).default("pending"),
  lastPing: timestamp("last_ping"),
  responseTime: integer("response_time"), // in milliseconds
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pingStats = pgTable("ping_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentCycle: integer("current_cycle").default(0),
  totalUrls: integer("total_urls").default(0),
  cycleStartTime: timestamp("cycle_start_time"),
  nextCycleTime: timestamp("next_cycle_time"),
  currentUrlIndex: integer("current_url_index").default(0),
  currentUrlId: varchar("current_url_id"),
  isRunning: boolean("is_running").default(false),
  successfulPingsToday: integer("successful_pings_today").default(0),
  failedPingsToday: integer("failed_pings_today").default(0),
});

export const insertUrlSchema = createInsertSchema(urls).pick({
  url: true,
  name: true,
}).extend({
  url: z.string().url("Please enter a valid URL"),
  name: z.string().optional(),
});

export type InsertUrl = z.infer<typeof insertUrlSchema>;
export type Url = typeof urls.$inferSelect;
export type PingStats = typeof pingStats.$inferSelect;
export type InsertPingStats = typeof pingStats.$inferInsert;