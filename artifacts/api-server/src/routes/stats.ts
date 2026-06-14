import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable } from "@workspace/db";
import { ne, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const [allPatients, doctors] = await Promise.all([
    db.select().from(patientsTable),
    db.select().from(doctorsTable),
  ]);

  const waiting = allPatients.filter((p) => p.status === "waiting").length;
  const active = allPatients.filter((p) => p.status === "called" || p.status === "consulting").length;
  const completed = allPatients.filter((p) => p.status === "completed").length;
  const emergency = allPatients.filter((p) => p.priority === "emergency" && p.status !== "completed").length;
  const urgent = allPatients.filter((p) => p.priority === "urgent" && p.status !== "completed").length;

  const availableDoctors = doctors.filter((d) => d.status === "available").length;
  const totalDoctors = doctors.length;

  const avgWait = waiting > 0 ? waiting * 15 : 0;
  const queueVelocity = totalDoctors > 0 ? Number((completed / Math.max(1, totalDoctors)).toFixed(1)) : 0;

  const efficiency = completed + waiting + active > 0
    ? Math.round((completed / (completed + waiting + active)) * 100)
    : 100;

  let aiScore = 100;
  if (emergency > 0) aiScore -= 20;
  if (waiting > 10) aiScore -= 15;
  if (availableDoctors === 0 && waiting > 0) aiScore -= 20;
  if (waiting > 5) aiScore -= 10;
  aiScore = Math.max(0, aiScore);

  const hour = new Date().getHours();
  let peakHourPrediction: string | null = null;
  if (hour >= 8 && hour < 10) peakHourPrediction = "Peak expected 10:00–12:00";
  else if (hour >= 14 && hour < 16) peakHourPrediction = "Evening rush 17:00–19:00";

  res.json({
    totalWaiting: waiting,
    totalActive: active,
    totalCompleted: completed,
    doctorsAvailable: availableDoctors,
    doctorsTotal: totalDoctors,
    queueVelocity,
    avgWaitMinutes: avgWait,
    aiHealthScore: aiScore,
    emergencyCount: emergency,
    urgentCount: urgent,
    peakHourPrediction,
    systemEfficiency: efficiency,
  });
});

router.get("/waiting-room", async (_req, res) => {
  const patients = await db
    .select()
    .from(patientsTable)
    .where(ne(patientsTable.status, "completed"));

  const nowServing = patients
    .filter((p) => p.status === "called" || p.status === "consulting")
    .map((p) => ({
      token: p.token,
      name: p.name,
      department: p.department,
      doctorName: p.doctorName,
      status: p.status,
      estimatedMinutes: null,
    }));

  const nextTokens = patients
    .filter((p) => p.status === "waiting")
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { emergency: 0, urgent: 1, normal: 2 };
      const pA = priorityOrder[a.priority] ?? 2;
      const pB = priorityOrder[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 5)
    .map((p, i) => ({
      token: p.token,
      name: p.name,
      department: p.department,
      doctorName: p.doctorName,
      status: p.status,
      estimatedMinutes: (i + 1) * 15,
    }));

  const totalInQueue = patients.filter((p) => p.status === "waiting").length;

  res.json({
    nowServing,
    nextTokens,
    currentTime: new Date().toISOString(),
    totalInQueue,
    estimatedClearTime: totalInQueue > 0
      ? new Date(Date.now() + totalInQueue * 15 * 60000).toISOString()
      : null,
  });
});

export default router;
