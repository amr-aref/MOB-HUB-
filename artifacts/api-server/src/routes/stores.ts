import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  storesTable,
  productsTable,
  reviewsTable,
} from "@workspace/db/schema";
import { and, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { toReviewDto } from "./reviews";

const router: IRouter = Router();

/** Map DB row to the API DTO (reconstructs coverGradient tuple) */
function toStoreDto(row: typeof storesTable.$inferSelect) {
  return {
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    descriptionAr: row.descriptionAr,
    descriptionEn: row.descriptionEn,
    logoColor: row.logoColor,
    logoInitial: row.logoInitial,
    coverGradient: [row.coverGradientFrom, row.coverGradientTo] as [string, string],
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    governorate: row.governorate,
    city: row.city,
    address: row.address,
    addressAr: row.addressAr,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    whatsapp: row.whatsapp,
    facebook: row.facebook ?? undefined,
    instagram: row.instagram ?? undefined,
    website: row.website ?? undefined,
    workingHours: row.workingHours,
    workingHoursAr: row.workingHoursAr,
    isOpen: row.isOpen,
    isVerified: row.isVerified,
    productsCount: row.productsCount,
    categories: row.categories,
  };
}

// GET /stores
router.get("/stores", async (req, res) => {
  const { search, governorate, isVerified, ids, sort } = req.query as Record<string, string>;

  let rows = await db.select().from(storesTable);

  if (ids) {
    const idList = ids.split(",").map((s) => s.trim());
    rows = rows.filter((r) => idList.includes(r.id));
  }
  if (isVerified === "true") {
    rows = rows.filter((r) => r.isVerified);
  }
  if (governorate) {
    rows = rows.filter((r) => r.governorate === governorate);
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.nameEn.toLowerCase().includes(q) ||
        r.nameAr.includes(search) ||
        r.governorate.includes(search) ||
        r.city.includes(search)
    );
  }
  if (sort === "rating") {
    rows = rows.sort((a, b) => b.rating - a.rating);
  }

  res.json(rows.map(toStoreDto));
});

// GET /stores/:id
router.get("/stores/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, req.params.id));
  if (!rows[0]) {
    res.status(404).json({ error: "Store not found" });
    return;
  }
  res.json(toStoreDto(rows[0]));
});

// GET /stores/:id/products
router.get("/stores/:id/products", async (req, res) => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.storeId, req.params.id));
  res.json(rows);
});

// GET /stores/:id/reviews  (active reviews only, mapped to ReviewDto)
router.get("/stores/:id/reviews", async (req, res) => {
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.storeId, req.params.id),
        eq(reviewsTable.status, "active"),
      ),
    );
  res.json(rows.map(toReviewDto));
});

export default router;
