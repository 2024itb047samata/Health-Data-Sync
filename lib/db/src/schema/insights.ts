import { pgTable, text, serial, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insightsTable = pgTable("insights", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  department: text("department"),
  confidence: numeric("confidence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInsightSchema = createInsertSchema(insightsTable).omit({ id: true, createdAt: true });
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insightsTable.$inferSelect;
