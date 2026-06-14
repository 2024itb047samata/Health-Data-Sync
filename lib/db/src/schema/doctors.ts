import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("available"),
  currentPatientId: integer("current_patient_id"),
  currentPatientName: text("current_patient_name"),
  patientsSeenToday: integer("patients_seen_today").notNull().default(0),
  avgConsultMinutes: numeric("avg_consult_minutes").notNull().default("15"),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
