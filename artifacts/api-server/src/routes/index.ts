import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import doctorsRouter from "./doctors";
import departmentsRouter from "./departments";
import queueRouter from "./queue";
import activityRouter from "./activity";
import insightsRouter from "./insights";
import statsRouter from "./stats";
import { subscribe } from "../lib/broadcast";

const router: IRouter = Router();

router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(": connected\n\n");
  subscribe(res);
});

router.use(healthRouter);
router.use(patientsRouter);
router.use(doctorsRouter);
router.use(departmentsRouter);
router.use(queueRouter);
router.use(activityRouter);
router.use(insightsRouter);
router.use(statsRouter);

export default router;
