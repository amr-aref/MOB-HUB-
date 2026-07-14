import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";

const router: IRouter = Router();

// GET /categories
router.get("/categories", async (_req, res) => {
  const rows = await db.select().from(categoriesTable);
  res.json(rows);
});

export default router;
