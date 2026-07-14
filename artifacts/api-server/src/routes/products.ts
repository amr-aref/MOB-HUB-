import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET /products
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

  let rows = await db.select().from(productsTable);

  if (ids) {
    const idList = ids.split(",").map((s) => s.trim());
    rows = rows.filter((r) => idList.includes(r.id));
  }
  if (storeId) rows = rows.filter((r) => r.storeId === storeId);
  if (category) rows = rows.filter((r) => r.category === category);
  if (isNew === "true") rows = rows.filter((r) => r.isNew);
  if (isBestSeller === "true") rows = rows.filter((r) => r.isBestSeller);
  if (isFeatured === "true") rows = rows.filter((r) => r.isFeatured);
  if (condition) rows = rows.filter((r) => r.condition === condition);
  if (excludeId) rows = rows.filter((r) => r.id !== excludeId);
  if (brand) rows = rows.filter((r) => r.brand.toLowerCase() === brand.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.nameEn.toLowerCase().includes(q) ||
        r.nameAr.includes(search) ||
        r.brand.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q)
    );
  }

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
