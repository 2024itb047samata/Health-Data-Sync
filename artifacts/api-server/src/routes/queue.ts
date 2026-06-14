import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, activityTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { broadcast } from "../lib/broadcast";

const router: IRouter = Router();

router.post("/queue/next", async (_req, res) => {
  const waiting = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.status, "waiting"))
    .orderBy(asc(patientsTable.createdAt));

  const emergencies = waiting.filter((p) => p.priority === "emergency");
  const urgent = waiting.filter((p) => p.priority === "urgent");
  const normal = waiting.filter((p) => p.priority === "normal");

  const next = emergencies[0] ?? urgent[0] ?? normal[0];

  if (!next) {
    res.json({ message: "Queue is empty", queueEmpty: true });
    return;
  }

  const [called] = await db
    .update(patientsTable)
    .set({ status: "called", calledAt: new Date(), journeyStep: "doctor_assigned" })
    .where(eq(patientsTable.id, next.id))
    .returning();

  await db.insert(activityTable).values({
    type: "patient_called",
    message: `Token ${called.token} — ${called.name} called to ${called.department}`,
    patientName: called.name,
    patientToken: called.token ?? undefined,
    department: called.department,
    priority: called.priority,
  });

  broadcast("queue_updated", { action: "next_called", token: called.token });

  res.json({
    patient: {
      ...called,
      createdAt: called.createdAt.toISOString(),
      calledAt: called.calledAt?.toISOString() ?? null,
      completedAt: called.completedAt?.toISOString() ?? null,
    },
    message: `Called ${called.name} (${called.token})`,
    queueEmpty: false,
  });
});

export default router;
