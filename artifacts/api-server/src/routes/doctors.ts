import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { doctorsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDoctorBody, UpdateDoctorBody, UpdateDoctorParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (_req, res) => {
  const doctors = await db.select().from(doctorsTable);
  res.json(doctors.map(serializeDoctor));
});

router.post("/doctors", async (req, res) => {
  const body = CreateDoctorBody.parse(req.body);
  const [doctor] = await db.insert(doctorsTable).values(body).returning();
  res.status(201).json(serializeDoctor(doctor));
});

router.patch("/doctors/:id", async (req, res) => {
  const { id } = UpdateDoctorParams.parse({ id: Number(req.params.id) });
  const body = UpdateDoctorBody.parse(req.body);

  const [doctor] = await db
    .update(doctorsTable)
    .set(body)
    .where(eq(doctorsTable.id, id))
    .returning();

  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  if (body.status === "available") {
    await db.insert(activityTable).values({
      type: "doctor_available",
      message: `Dr. ${doctor.name} is now available`,
      department: doctor.department,
    });
  }

  res.json(serializeDoctor(doctor));
});

function serializeDoctor(d: typeof doctorsTable.$inferSelect) {
  return {
    ...d,
    avgConsultMinutes: Number(d.avgConsultMinutes),
  };
}

export default router;
