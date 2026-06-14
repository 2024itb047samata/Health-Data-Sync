import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  department: text("department").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("waiting"),
  doctorId: integer("doctor_id"),
  doctorName: text("doctor_name"),
  reason: text("reason"),
  estimatedWaitMinutes: integer("estimated_wait_minutes"),
  queuePosition: integer("queue_position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
