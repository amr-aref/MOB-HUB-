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
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Resolve the storeId from the request query.
 *
 * In production this will be derived from the authenticated session once auth
 * lands. For the current development/demo phase, callers should pass ?storeId=
 * explicitly. When omitted, we fall back to the seed-data store ("s1") and log
 * a warning so the gap is visible in server logs.
 */
function resolveStoreId(req: { query: Record<string, unknown> }): string {
  const id = req.query["storeId"];
  if (typeof id === "string" && id.trim().length > 0) return id.trim();
  logger.warn(
    { url: (req as { url?: string }).url },
    "Dashboard request missing storeId — using seed default (s1). This must be fixed before production.",
  );
  return "s1";
}

// GET /dashboard/stats?storeId=
router.get("/dashboard/stats", async (req, res) => {
  const storeId = resolveStoreId(req as Parameters<typeof resolveStoreId>[0]);
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
  const { id: _id, ...rest } = rows[0];
  res.json(rest);
});

// GET /dashboard/orders?storeId=
router.get("/dashboard/orders", async (req, res) => {
  const storeId = resolveStoreId(req as Parameters<typeof resolveStoreId>[0]);
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
    })),
  );
});

// GET /dashboard/messages?storeId=
router.get("/dashboard/messages", async (req, res) => {
  const storeId = resolveStoreId(req as Parameters<typeof resolveStoreId>[0]);
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
    })),
  );
});

// GET /dashboard/reviews?storeId=
router.get("/dashboard/reviews", async (req, res) => {
  const storeId = resolveStoreId(req as Parameters<typeof resolveStoreId>[0]);
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.storeId, storeId));
  res.json(rows);
});

// POST /dashboard/products — create a product
router.post("/dashboard/products", async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const storeId =
    typeof body["storeId"] === "string" && body["storeId"].trim().length > 0
      ? body["storeId"].trim()
      : "s1";

  const nameAr = body["nameAr"];
  const nameEn = body["nameEn"];
  const brand = body["brand"];
  const model = body["model"];
  const price = body["price"];
  const category = body["category"];

  if (!nameAr || !nameEn || !brand || !model || !price || !category) {
    res.status(400).json({
      error: "Missing required fields",
      required: ["nameAr", "nameEn", "brand", "model", "price", "category"],
    });
    return;
  }

  const discountPrice = body["discountPrice"];
  const condition =
    typeof body["condition"] === "string" ? body["condition"] : "new";
  const inStock = body["inStock"] !== false;

  const id = `p_${randomHex()}`;

  await db.insert(productsTable).values({
    id,
    storeId,
    nameAr: nameAr as string,
    nameEn: nameEn as string,
    descriptionAr: typeof body["descriptionAr"] === "string" ? body["descriptionAr"] : "",
    descriptionEn: typeof body["descriptionEn"] === "string" ? body["descriptionEn"] : "",
    brand: brand as string,
    model: model as string,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    category: category as string,
    condition,
    inStock,
    warranty: typeof body["warranty"] === "string" ? body["warranty"] : "",
    warrantyAr: typeof body["warrantyAr"] === "string" ? body["warrantyAr"] : "",
    colors: Array.isArray(body["colors"]) ? (body["colors"] as string[]) : [],
    storage: typeof body["storage"] === "string" ? body["storage"] : undefined,
    ram: typeof body["ram"] === "string" ? body["ram"] : undefined,
    imageColor:
      typeof body["imageColor"] === "string" ? body["imageColor"] : "#2563EB",
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

/** Short random hex suffix — used only for product IDs in the demo dashboard. */
function randomHex(): string {
  return Math.random().toString(16).slice(2, 10);
}

export default router;
