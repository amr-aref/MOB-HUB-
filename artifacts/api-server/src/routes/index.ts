import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import productsRouter from "./products";
import phoneSpecsRouter from "./phoneSpecs";
import categoriesRouter from "./categories";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(productsRouter);
router.use(phoneSpecsRouter);
router.use(categoriesRouter);
router.use(dashboardRouter);

export default router;
