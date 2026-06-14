import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import doctorsRouter from "./doctors";
import departmentsRouter from "./departments";
import queueRouter from "./queue";
import activityRouter from "./activity";
import insightsRouter from "./insights";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(doctorsRouter);
router.use(departmentsRouter);
router.use(queueRouter);
router.use(activityRouter);
router.use(insightsRouter);
router.use(statsRouter);

export default router;
