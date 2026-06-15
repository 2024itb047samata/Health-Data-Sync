import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, activityTable } from "@workspace/db";
import { eq, asc, ne } from "drizzle-orm";
import {
  CreatePatientBody,
  UpdatePatientBody,
  UpdatePatientParams,
  GetPatientParams,
  DeletePatientParams,
  CallPatientParams,
  CompleteConsultationParams,
} from "@workspace/api-zod";
import { broadcast } from "../lib/broadcast";

const router: IRouter = Router();

function generateToken(count: number): string {
  const letter = String.fromCharCode(65 + Math.floor(count / 100));
  const num = String(count % 100).padStart(3, "0");
  return `${letter}-${num}`;
}

async function logActivity(
  type: string,
  message: string,
  extra?: { patientName?: string; patientToken?: string; department?: string; priority?: string }
) {
  await db.insert(activityTable).values({ type, message, ...extra });
}

router.get("/patients", async (req, res) => {
  try {
    const patients = await db
      .select()
      .from(patientsTable)
      .where(ne(patientsTable.status, "completed"))
      .orderBy(asc(patientsTable.createdAt));

    res.json(patients.map(serializePatient));
  } catch (err) {
    console.error("PATIENTS ERROR:", err);

    res.status(500).json({
      error: String(err),
      details: err,
    });
  }
});

router.post("/patients", async (req, res) => {
  const body = CreatePatientBody.parse(req.body);

  const allPatients = await db.select().from(patientsTable).where(ne(patientsTable.status, "completed"));
  const count = allPatients.length;
  const token = generateToken(count + 1);

  const waiting = allPatients.filter((p) => p.status === "waiting");
  const position = waiting.length + 1;
  const avgWait = 15;
  const estimatedWait = position * avgWait;

  // Determine AI summary based on reason + history hint
  const aiSummary = body.reason
    ? `AI: Patient presents with ${body.reason}. ${body.abhaId ? `ABHA records loaded — prior visit history available.` : "No prior ABHA records linked."} ${body.referredBy ? `Referred by ${body.referredBy}.` : ""}`
    : undefined;

  const journeyStep = body.abhaId ? "ai_analyzed" : "registered";

  const [patient] = await db
    .insert(patientsTable)
    .values({
      ...body,
      token,
      status: body.priority === "emergency" ? "called" : "waiting",
      queuePosition: position,
      estimatedWaitMinutes: estimatedWait,
      journeyStep,
      aiSummary,
    })
    .returning();

  const eventType = body.priority === "emergency" ? "emergency_arrived" : "patient_added";
  const activityMsg = body.priority === "emergency"
    ? `🚨 EMERGENCY: ${body.name} — ${body.reason || body.department} — Protocol ALPHA activated`
    : body.abhaId
      ? `${body.name} registered — ABHA ${body.abhaId} linked (records loaded)`
      : `${body.name} registered in ${body.department}`;

  await logActivity(eventType, activityMsg, {
    patientName: body.name,
    patientToken: token,
    department: body.department,
    priority: body.priority,
  });

  broadcast("queue_updated", { action: "patient_added", token, priority: body.priority });
  res.status(201).json(serializePatient(patient));
});

router.get("/patients/:id", async (req, res) => {
  const { id } = GetPatientParams.parse({ id: Number(req.params.id) });
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(serializePatient(patient));
});

router.patch("/patients/:id", async (req, res) => {
  const { id } = UpdatePatientParams.parse({ id: Number(req.params.id) });
  const body = UpdatePatientBody.parse(req.body);

  const [patient] = await db
    .update(patientsTable)
    .set(body)
    .where(eq(patientsTable.id, id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  broadcast("queue_updated", { action: "patient_updated", id });
  res.json(serializePatient(patient));
});

router.delete("/patients/:id", async (req, res) => {
  const { id } = DeletePatientParams.parse({ id: Number(req.params.id) });
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  await db.delete(patientsTable).where(eq(patientsTable.id, id));
  await logActivity("patient_added", `Patient ${patient.name} removed from queue`, {
    patientName: patient.name,
    patientToken: patient.token ?? undefined,
    department: patient.department,
  });
  broadcast("queue_updated", { action: "patient_removed", id });
  res.status(204).send();
});

router.post("/patients/:id/call", async (req, res) => {
  const { id } = CallPatientParams.parse({ id: Number(req.params.id) });
  const [patient] = await db
    .update(patientsTable)
    .set({ status: "called", calledAt: new Date(), journeyStep: "doctor_assigned" })
    .where(eq(patientsTable.id, id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  await logActivity("patient_called", `Token ${patient.token} — ${patient.name} called to ${patient.department}`, {
    patientName: patient.name,
    patientToken: patient.token ?? undefined,
    department: patient.department,
    priority: patient.priority,
  });

  broadcast("queue_updated", { action: "patient_called", token: patient.token });
  res.json(serializePatient(patient));
});

router.post("/patients/:id/complete", async (req, res) => {
  const { id } = CompleteConsultationParams.parse({ id: Number(req.params.id) });
  const [patient] = await db
    .update(patientsTable)
    .set({ status: "completed", completedAt: new Date(), journeyStep: "completed" })
    .where(eq(patientsTable.id, id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  await logActivity(
    "consultation_completed",
    `Consultation completed — ${patient.name} (${patient.token}), ${patient.department}`,
    {
      patientName: patient.name,
      patientToken: patient.token ?? undefined,
      department: patient.department,
      priority: patient.priority,
    }
  );

  broadcast("queue_updated", { action: "consultation_completed", token: patient.token });
  res.json(serializePatient(patient));
});

function serializePatient(p: typeof patientsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    calledAt: p.calledAt?.toISOString() ?? null,
    completedAt: p.completedAt?.toISOString() ?? null,
  };
}

export default router;
