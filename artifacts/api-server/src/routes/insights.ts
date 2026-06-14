import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { insightsTable, patientsTable, doctorsTable } from "@workspace/db";
import { ne, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/insights", async (_req, res) => {
  const [patients, doctors, storedInsights] = await Promise.all([
    db.select().from(patientsTable).where(ne(patientsTable.status, "completed")),
    db.select().from(doctorsTable),
    db.select().from(insightsTable).orderBy(desc(insightsTable.createdAt)).limit(10),
  ]);

  const waiting = patients.filter((p) => p.status === "waiting").length;
  const emergency = patients.filter((p) => p.priority === "emergency").length;
  const busy = doctors.filter((d) => d.status === "busy").length;
  const available = doctors.filter((d) => d.status === "available").length;

  const dynamicInsights: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    department: string | null;
    confidence: number | null;
    createdAt: string;
  }> = [];

  let counter = 9000;
  if (emergency > 0) {
    dynamicInsights.push({
      id: counter++,
      type: "critical",
      title: "Emergency Patients Detected",
      message: `${emergency} emergency patient${emergency > 1 ? "s" : ""} in queue. Immediate attention required.`,
      department: null,
      confidence: 99,
      createdAt: new Date().toISOString(),
    });
  }

  if (waiting > 8) {
    dynamicInsights.push({
      id: counter++,
      type: "warning",
      title: "Queue Congestion Detected",
      message: `${waiting} patients waiting. Queue velocity is below optimal threshold.`,
      department: null,
      confidence: 87,
      createdAt: new Date().toISOString(),
    });
  }

  if (available === 0 && waiting > 0) {
    dynamicInsights.push({
      id: counter++,
      type: "warning",
      title: "No Doctors Available",
      message: "All doctors are currently occupied. Expected queue delay of 15-30 minutes.",
      department: null,
      confidence: 92,
      createdAt: new Date().toISOString(),
    });
  }

  if (available > busy && waiting > 0) {
    dynamicInsights.push({
      id: counter++,
      type: "info",
      title: "Capacity Available",
      message: `${available} doctors available. Queue can be cleared efficiently.`,
      department: null,
      confidence: 95,
      createdAt: new Date().toISOString(),
    });
  }

  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 11) {
    dynamicInsights.push({
      id: counter++,
      type: "info",
      title: "Peak Hour Approaching",
      message: "Historical data suggests 30% higher patient volume in the next 60 minutes.",
      department: null,
      confidence: 78,
      createdAt: new Date().toISOString(),
    });
  }

  if (waiting === 0 && available > 0) {
    dynamicInsights.push({
      id: counter++,
      type: "success",
      title: "Queue Clear",
      message: "All patients have been attended to. System operating at optimal efficiency.",
      department: null,
      confidence: 100,
      createdAt: new Date().toISOString(),
    });
  }

  const combined = [
    ...dynamicInsights,
    ...storedInsights.map((i) => ({
      ...i,
      confidence: i.confidence ? Number(i.confidence) : null,
      createdAt: i.createdAt.toISOString(),
    })),
  ].slice(0, 8);

  res.json(combined);
});

export default router;
