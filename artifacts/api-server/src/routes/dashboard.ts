import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  ordersTable,
  messagesTable,
  reviewsTable,
  dashboardStatsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// GET /dashboard/stats?storeId=
router.get("/dashboard/stats", async (req, res) => {
  const { storeId = "s1" } = req.query as { storeId?: string };
  const rows = await db
    .select()
    .from(dashboardStatsTable)
    .where(eq(dashboardStatsTable.storeId, storeId));
  if (!rows[0]) {
    res.json({
      storeId,
      views: 0,
      visitors: 0,
      clicks: 0,
      reservations: 0,
      newReviews: 0,
      messagesCount: 0,
      saved: 0,
      trending: 0,
    });
    return;
  }
  const { id, ...rest } = rows[0];
  res.json(rest);
});

// GET /dashboard/orders?storeId=
router.get("/dashboard/orders", async (req, res) => {
  const { storeId = "s1" } = req.query as { storeId?: string };
  const rows = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.storeId, storeId));
  res.json(
    rows.map((r) => ({
      id: r.id,
      productAr: r.productAr,
      productEn: r.productEn,
      storage: r.storage,
      customer: r.customer,
      timeAr: r.timeAr,
      timeEn: r.timeEn,
      status: r.status,
      price: r.price,
    }))
  );
});

// GET /dashboard/messages?storeId=
router.get("/dashboard/messages", async (req, res) => {
  const { storeId = "s1" } = req.query as { storeId?: string };
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.storeId, storeId));
  res.json(
    rows.map((r) => ({
      id: r.id,
      customer: r.customer,
      productAr: r.productAr,
      productEn: r.productEn,
      timeAr: r.timeAr,
      timeEn: r.timeEn,
      status: r.status,
      unread: r.unread,
    }))
  );
});

// GET /dashboard/reviews?storeId=
router.get("/dashboard/reviews", async (req, res) => {
  const { storeId = "s1" } = req.query as { storeId?: string };
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.storeId, storeId));
  res.json(rows);
});

// POST /dashboard/products — create a product
router.post("/dashboard/products", async (req, res) => {
  const {
    storeId = "s1",
    nameAr,
    nameEn,
    descriptionAr = "",
    descriptionEn = "",
    brand,
    model,
    price,
    discountPrice,
    category,
    condition = "new",
    warranty = "",
    warrantyAr = "",
    colors = [],
    storage,
    ram,
    imageColor = "#2563EB",
    inStock = true,
  } = req.body as Record<string, any>;

  if (!nameAr || !nameEn || !brand || !model || !price || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const id = `p_${Date.now()}`;

  await db.insert(productsTable).values({
    id,
    storeId,
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    brand,
    model,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    category,
    condition,
    inStock,
    warranty,
    warrantyAr,
    colors,
    storage,
    ram,
    imageColor,
    rating: 0,
    reviewsCount: 0,
    isNew: true,
    isBestSeller: false,
    isFeatured: false,
  });

  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  res.status(201).json(rows[0]);
});

export default router;
