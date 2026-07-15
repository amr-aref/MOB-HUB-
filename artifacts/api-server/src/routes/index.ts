import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import reviewsRouter from "./reviews";
import productsRouter from "./products";
import phoneSpecsRouter from "./phoneSpecs";
import categoriesRouter from "./categories";
import dashboardRouter from "./dashboard";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(reviewsRouter);
router.use(productsRouter);
router.use(phoneSpecsRouter);
router.use(categoriesRouter);
router.use(dashboardRouter);
router.use(conversationsRouter);

export default router;
