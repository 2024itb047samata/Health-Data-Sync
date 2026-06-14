import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/activity", async (_req, res) => {
  const events = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(50);

  res.json(
    events.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    }))
  );
});

export default router;
