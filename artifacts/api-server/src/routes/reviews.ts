import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewsTable, storesTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { createNotification } from "../services/notificationService";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// DTO mapping
// ---------------------------------------------------------------------------

export function toReviewDto(row: typeof reviewsTable.$inferSelect) {
  return {
    id: row.id,
    storeId: row.storeId ?? undefined,
    productId: row.productId ?? undefined,
    userId: row.userId ?? undefined,
    author: row.author,
    authorAr: row.authorAr,
    rating: row.rating,
    title: row.title,
    textAr: row.textAr,
    textEn: row.textEn,
    date: row.date,
    status: row.status,
    helpfulCount: row.helpfulCount,
    verifiedPurchase: row.verifiedPurchase,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

interface ValidCreateData {
  author: string;
  authorAr: string;
  rating: number;
  title: string;
  textEn: string;
  textAr: string;
  userId: string | undefined;
}

interface ValidUpdateData {
  rating: number;
  title: string;
  textEn: string;
  textAr: string;
  userId: string;
}

function validateCreateBody(
  raw: unknown,
): { ok: true; data: ValidCreateData } | { ok: false; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }
  const b = raw as Record<string, unknown>;
  const errors: string[] = [];

  const author = typeof b.author === "string" ? b.author.trim() : "";
  const authorAr = typeof b.authorAr === "string" ? b.authorAr.trim() : author;
  const rating = b.rating;
  const textEn = typeof b.textEn === "string" ? b.textEn.trim() : "";
  const textAr = typeof b.textAr === "string" ? b.textAr.trim() : textEn;
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 100) : "";
  const userId = typeof b.userId === "string" && b.userId.length > 0 ? b.userId : undefined;

  if (author.length < 2) errors.push("Author name must be at least 2 characters");
  if (author.length > 60) errors.push("Author name is too long (max 60 characters)");

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer between 1 and 5");
  }

  if (textEn.length < 10) errors.push("Review text must be at least 10 characters");
  if (textEn.length > 1000) errors.push("Review text is too long (max 1000 characters)");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      author,
      authorAr: authorAr || author,
      rating: rating as number,
      title,
      textEn,
      textAr: textAr || textEn,
      userId,
    },
  };
}

function validateUpdateBody(
  raw: unknown,
): { ok: true; data: ValidUpdateData } | { ok: false; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }
  const b = raw as Record<string, unknown>;
  const errors: string[] = [];

  const rating = b.rating;
  const textEn = typeof b.textEn === "string" ? b.textEn.trim() : "";
  const textAr = typeof b.textAr === "string" ? b.textAr.trim() : textEn;
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 100) : "";
  const userId = typeof b.userId === "string" ? b.userId : "";

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer between 1 and 5");
  }
  if (textEn.length < 10) errors.push("Review text must be at least 10 characters");
  if (textEn.length > 1000) errors.push("Review text is too long (max 1000 characters)");
  if (!userId) errors.push("userId is required");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: { rating: rating as number, title, textEn, textAr: textAr || textEn, userId },
  };
}

// ---------------------------------------------------------------------------
// Rating recalculation
// ---------------------------------------------------------------------------

async function recalculateStoreRating(storeId: string): Promise<void> {
  const activeReviews = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.storeId, storeId), eq(reviewsTable.status, "active")));

  const count = activeReviews.length;
  const average =
    count > 0
      ? Math.round(
          (activeReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10,
        ) / 10
      : 0;

  await db
    .update(storesTable)
    .set({ rating: average, reviewsCount: count })
    .where(eq(storesTable.id, storeId));
}

// ---------------------------------------------------------------------------
// ID + date helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatDisplayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// POST /stores/:id/reviews
// ---------------------------------------------------------------------------

router.post("/stores/:id/reviews", async (req, res) => {
  const storeId = req.params.id;

  // Verify store exists
  const [store] = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(eq(storesTable.id, storeId));

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const validation = validateCreateBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }

  const { author, authorAr, rating, title, textEn, textAr, userId } = validation.data;

  // Prevent duplicate review from the same device
  if (userId) {
    const [existing] = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.storeId, storeId), eq(reviewsTable.userId, userId)));

    if (existing) {
      res.status(409).json({
        error: "You have already reviewed this store",
        code: "DUPLICATE_REVIEW",
      });
      return;
    }
  }

  const [newReview] = await db
    .insert(reviewsTable)
    .values({
      id: generateId(),
      storeId,
      userId: userId ?? null,
      author,
      authorAr,
      rating,
      title,
      textEn,
      textAr,
      date: formatDisplayDate(),
      status: "active",
    })
    .returning();

  await recalculateStoreRating(storeId);

  // Notify the store owner (Notification Types: Review Received).
  await createNotification({
    userId: storeId,
    type: "review_received",
    titleAr: "تقييم جديد",
    titleEn: "New Review",
    bodyAr: `${authorAr} قيّم متجرك بـ ${rating} نجوم`,
    bodyEn: `${author} rated your store ${rating} stars`,
    metadata: { reviewId: newReview.id, storeId, rating },
  });

  res.status(201).json(toReviewDto(newReview));
});

// ---------------------------------------------------------------------------
// PUT /reviews/:id
// ---------------------------------------------------------------------------

router.put("/reviews/:id", async (req, res) => {
  const { id } = req.params;

  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const validation = validateUpdateBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }

  const { rating, title, textEn, textAr, userId } = validation.data;

  // Ownership check: only the author's device may edit
  if (review.userId && review.userId !== userId) {
    res.status(403).json({ error: "You can only edit your own reviews" });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ rating, title, textEn, textAr, updatedAt: new Date() })
    .where(eq(reviewsTable.id, id))
    .returning();

  if (updated.storeId) {
    await recalculateStoreRating(updated.storeId);
  }

  res.json(toReviewDto(updated));
});

// ---------------------------------------------------------------------------
// DELETE /reviews/:id?userId=<deviceId>
// ---------------------------------------------------------------------------

router.delete("/reviews/:id", async (req, res) => {
  const { id } = req.params;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  // Ownership check
  if (review.userId && review.userId !== userId) {
    res.status(403).json({ error: "You can only delete your own reviews" });
    return;
  }

  const storeId = review.storeId;

  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));

  if (storeId) {
    await recalculateStoreRating(storeId);
  }

  res.status(204).send();
});

export default router;
