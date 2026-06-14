import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  age: integer("age"),
  gender: text("gender"),
  phone: text("phone"),
  bloodGroup: text("blood_group"),
  abhaId: text("abha_id"),
  village: text("village"),
  district: text("district"),
  referredBy: text("referred_by"),
  department: text("department").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("waiting"),
  doctorId: integer("doctor_id"),
  doctorName: text("doctor_name"),
  reason: text("reason"),
  journeyStep: text("journey_step").notNull().default("registered"),
  aiSummary: text("ai_summary"),
  estimatedWaitMinutes: integer("estimated_wait_minutes"),
  queuePosition: integer("queue_position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
