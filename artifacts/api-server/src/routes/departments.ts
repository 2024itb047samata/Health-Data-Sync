import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, doctorsTable } from "@workspace/db";
import { eq, ne, and } from "drizzle-orm";

const router: IRouter = Router();

const DEPARTMENTS = [
  { id: 1, name: "General Medicine", code: "GM" },
  { id: 2, name: "Cardiology", code: "CARD" },
  { id: 3, name: "Orthopedics", code: "ORTH" },
  { id: 4, name: "Pediatrics", code: "PED" },
  { id: 5, name: "Emergency", code: "ER" },
  { id: 6, name: "Neurology", code: "NEURO" },
];

router.get("/departments", async (_req, res) => {
  const [patients, doctors] = await Promise.all([
    db.select().from(patientsTable).where(ne(patientsTable.status, "completed")),
    db.select().from(doctorsTable),
  ]);

  const departments = DEPARTMENTS.map((dept) => {
    const deptPatients = patients.filter((p) => p.department === dept.name);
    const waiting = deptPatients.filter((p) => p.status === "waiting").length;
    const active = deptPatients.filter((p) => p.status === "consulting" || p.status === "called").length;
    const deptDoctors = doctors.filter((d) => d.department === dept.name);
    const available = deptDoctors.filter((d) => d.status === "available").length;
    const total = waiting + active;

    let loadLevel: string;
    if (total === 0) loadLevel = "low";
    else if (total <= 3) loadLevel = "moderate";
    else if (total <= 6) loadLevel = "high";
    else loadLevel = "critical";

    const avgWait = waiting > 0 ? waiting * 15 : 0;

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      waitingCount: waiting,
      activeCount: active,
      doctorsAvailable: available,
      avgWaitMinutes: avgWait,
      loadLevel,
    };
  });

  res.json(departments);
});

export default router;
