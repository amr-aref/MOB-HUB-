import { randomUUID } from "crypto";
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
import { requireAuth } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/authorize";
import { AppError } from "../lib/api-helpers";

const router: IRouter = Router();
const dashboardAuth = [requireAuth, requireRole("merchant", "admin")];

function resolveStoreId(req: Parameters<typeof requireAuth>[0]): string {
  const requested = typeof req.query.storeId === "string" ? req.query.storeId.trim() : "";

  if (req.user!.role === "admin") {
    if (!requested) throw new AppError(400, "storeId is required", "STORE_REQUIRED");
    return requested;
  }

  const ownStoreId = req.user!.storeId?.trim();
  if (!ownStoreId) throw new AppError(403, "Merchant has no assigned store", "STORE_NOT_ASSIGNED");
  if (requested && requested !== ownStoreId) {
    throw new AppError(403, "Access denied for this store", "FORBIDDEN");
  }
  return ownStoreId;
}

router.get("/dashboard/stats", ...dashboardAuth, async (req, res) => {
  const storeId = resolveStoreId(req);
  const rows = await db.select().from(dashboardStatsTable).where(eq(dashboardStatsTable.storeId, storeId));
  if (!rows[0]) {
    res.json({ storeId, views: 0, visitors: 0, clicks: 0, reservations: 0, newReviews: 0, messagesCount: 0, saved: 0, trending: 0 });
    return;
  }
  const { id: _id, ...rest } = rows[0];
  res.json(rest);
});

router.get("/dashboard/orders", ...dashboardAuth, async (req, res) => {
  const storeId = resolveStoreId(req);
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.storeId, storeId));
  res.json(rows.map((r) => ({ id: r.id, productAr: r.productAr, productEn: r.productEn, storage: r.storage, customer: r.customer, timeAr: r.timeAr, timeEn: r.timeEn, status: r.status, price: r.price })));
});

router.get("/dashboard/messages", ...dashboardAuth, async (req, res) => {
  const storeId = resolveStoreId(req);
  const rows = await db.select().from(messagesTable).where(eq(messagesTable.storeId, storeId));
  res.json(rows.map((r) => ({ id: r.id, customer: r.customer, productAr: r.productAr, productEn: r.productEn, timeAr: r.timeAr, timeEn: r.timeEn, status: r.status, unread: r.unread })));
});

router.get("/dashboard/reviews", ...dashboardAuth, async (req, res) => {
  const storeId = resolveStoreId(req);
  const rows = await db.select().from(reviewsTable).where(eq(reviewsTable.storeId, storeId));
  res.json(rows);
});

router.post("/dashboard/products", ...dashboardAuth, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const storeId = req.user!.role === "admin"
    ? (typeof body.storeId === "string" ? body.storeId.trim() : "")
    : (req.user!.storeId?.trim() ?? "");

  if (!storeId) {
    res.status(400).json({ error: "storeId is required", code: "STORE_REQUIRED" });
    return;
  }
  if (req.user!.role === "merchant" && typeof body.storeId === "string" && body.storeId.trim() !== storeId) {
    res.status(403).json({ error: "Access denied for this store", code: "FORBIDDEN" });
    return;
  }

  const nameAr = typeof body.nameAr === "string" ? body.nameAr.trim() : "";
  const nameEn = typeof body.nameEn === "string" ? body.nameEn.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const discountPrice = body.discountPrice === undefined || body.discountPrice === null || body.discountPrice === ""
    ? undefined
    : Number(body.discountPrice);

  if (!nameAr || !nameEn || !brand || !model || !category || !Number.isFinite(price) || price <= 0) {
    res.status(400).json({ error: "Invalid required product fields", required: ["nameAr", "nameEn", "brand", "model", "price", "category"] });
    return;
  }
  if (discountPrice !== undefined && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) {
    res.status(400).json({ error: "Invalid discountPrice" });
    return;
  }

  const condition = typeof body.condition === "string" ? body.condition : "new";
  const inStock = body.inStock !== false;
  const id = `p_${randomUUID()}`;

  await db.insert(productsTable).values({
    id,
    storeId,
    nameAr,
    nameEn,
    descriptionAr: typeof body.descriptionAr === "string" ? body.descriptionAr : "",
    descriptionEn: typeof body.descriptionEn === "string" ? body.descriptionEn : "",
    brand,
    model,
    price,
    discountPrice,
    category,
    condition,
    inStock,
    warranty: typeof body.warranty === "string" ? body.warranty : "",
    warrantyAr: typeof body.warrantyAr === "string" ? body.warrantyAr : "",
    colors: Array.isArray(body.colors) && body.colors.every((v) => typeof v === "string") ? body.colors as string[] : [],
    storage: typeof body.storage === "string" ? [body.storage] : undefined,
    ram: typeof body.ram === "string" ? [body.ram] : undefined,
    imageColor: typeof body.imageColor === "string" ? body.imageColor : "#2563EB",
    rating: 0,
    reviewsCount: 0,
    isNew: true,
    isBestSeller: false,
    isFeatured: false,
  });

  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
  res.status(201).json(rows[0]);
});

export default router;
