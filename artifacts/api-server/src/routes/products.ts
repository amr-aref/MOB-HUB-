import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { and, eq, ilike, inArray, ne, or } from "drizzle-orm";

const router: IRouter = Router();

// GET /products
// All filters pushed to SQL — no in-memory post-filtering.
router.get("/products", async (req, res) => {
  const {
    storeId,
    category,
    isNew,
    isBestSeller,
    isFeatured,
    condition,
    ids,
    excludeId,
    search,
    brand,
  } = req.query as Record<string, string>;

  const conditions = [];

  if (ids) {
    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
    if (idList.length === 0) { res.json([]); return; }
    conditions.push(inArray(productsTable.id, idList));
  }
  if (storeId) conditions.push(eq(productsTable.storeId, storeId));
  if (category) conditions.push(eq(productsTable.category, category));
  if (isNew === "true") conditions.push(eq(productsTable.isNew, true));
  if (isBestSeller === "true") conditions.push(eq(productsTable.isBestSeller, true));
  if (isFeatured === "true") conditions.push(eq(productsTable.isFeatured, true));
  if (condition) conditions.push(eq(productsTable.condition, condition));
  if (excludeId) conditions.push(ne(productsTable.id, excludeId));
  if (brand) conditions.push(ilike(productsTable.brand, brand));
  if (search) {
    conditions.push(
      or(
        ilike(productsTable.nameEn, `%${search}%`),
        ilike(productsTable.nameAr, `%${search}%`),
        ilike(productsTable.brand, `%${search}%`),
        ilike(productsTable.model, `%${search}%`),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(rows);
});

// GET /products/:id
router.get("/products/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, req.params.id));
  if (!rows[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(rows[0]);
});

export default router;
