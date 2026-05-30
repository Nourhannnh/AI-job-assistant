import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import dashboardRouter from "./dashboard";
import cvRouter from "./cv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysesRouter);
router.use(dashboardRouter);
router.use(cvRouter);

export default router;
