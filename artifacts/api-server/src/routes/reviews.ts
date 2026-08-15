import { randomUUID } from "crypto";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewsTable, storesTable, usersTable } from "@workspace/db/schema";
import { and, avg, count as sqlCount, eq } from "drizzle-orm";
import { createNotification } from "../services/notificationService";
import { requireAuth } from "../middlewares/authenticate";

const router: IRouter = Router();

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

interface ValidCreateData {
  author: string;
  authorAr: string;
  rating: number;
  title: string;
  textEn: string;
  textAr: string;
}

interface ValidUpdateData {
  rating: number;
  title: string;
  textEn: string;
  textAr: string;
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

  if (author.length < 2) errors.push("Author name must be at least 2 characters");
  if (author.length > 60) errors.push("Author name is too long (max 60 characters)");

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
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

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    errors.push("Rating must be an integer between 1 and 5");
  }
  if (textEn.length < 10) errors.push("Review text must be at least 10 characters");
  if (textEn.length > 1000) errors.push("Review text is too long (max 1000 characters)");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: { rating: rating as number, title, textEn, textAr: textAr || textEn },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recalculateStoreRating(storeId: string, client: any = db): Promise<void> {
  const [result] = await client
    .select({ avg: avg(reviewsTable.rating), count: sqlCount() })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.storeId, storeId), eq(reviewsTable.status, "active")));

  const reviewCount = Number(result?.count ?? 0);
  const average =
    reviewCount > 0 ? Math.round(Number(result?.avg ?? 0) * 10) / 10 : 0;

  await client
    .update(storesTable)
    .set({ rating: average, reviewsCount: reviewCount })
    .where(eq(storesTable.id, storeId));
}

function generateId(): string {
  return `rev_${randomUUID()}`;
}

function formatDisplayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function resolveMerchantUserId(storeId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.storeId, storeId))
    .limit(1);
  return user?.id ?? null;
}

// POST /stores/:id/reviews — authenticated; userId from session
router.post("/stores/:id/reviews", requireAuth, async (req, res) => {
  const storeId = req.params.id;
  const sessionUserId = req.user!.sub;

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

  const { author, authorAr, rating, title, textEn, textAr } = validation.data;

  const [existing] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.storeId, storeId), eq(reviewsTable.userId, sessionUserId)));

  if (existing) {
    res.status(409).json({
      error: "You have already reviewed this store",
      code: "DUPLICATE_REVIEW",
    });
    return;
  }

  const newReview = await db.transaction(async (tx) => {
    const [review] = await tx
      .insert(reviewsTable)
      .values({
        id: generateId(),
        storeId,
        userId: sessionUserId,
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

    await recalculateStoreRating(storeId, tx);
    return review;
  });

  const merchantUserId = await resolveMerchantUserId(storeId);
  if (merchantUserId) {
    await createNotification({
      userId: merchantUserId,
      type: "review_received",
      titleAr: "تقييم جديد",
      titleEn: "New Review",
      bodyAr: `${authorAr} قيّم متجرك بـ ${rating} نجوم`,
      bodyEn: `${author} rated your store ${rating} stars`,
      metadata: { reviewId: newReview.id, storeId, rating },
    });
  }

  res.status(201).json(toReviewDto(newReview));
});

// PUT /reviews/:id — owner only (session)
router.put("/reviews/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const sessionUserId = req.user!.sub;

  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (!review.userId || review.userId !== sessionUserId) {
    res.status(403).json({ error: "You can only edit your own reviews" });
    return;
  }

  const validation = validateUpdateBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }

  const { rating, title, textEn, textAr } = validation.data;

  const updated = await db.transaction(async (tx) => {
    const [updatedReview] = await tx
      .update(reviewsTable)
      .set({ rating, title, textEn, textAr, updatedAt: new Date() })
      .where(eq(reviewsTable.id, id))
      .returning();

    if (updatedReview.storeId) {
      await recalculateStoreRating(updatedReview.storeId, tx);
    }

    return updatedReview;
  });

  res.json(toReviewDto(updated));
});

// DELETE /reviews/:id — owner only (session)
router.delete("/reviews/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const sessionUserId = req.user!.sub;

  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  if (!review.userId || review.userId !== sessionUserId) {
    res.status(403).json({ error: "You can only delete your own reviews" });
    return;
  }

  const storeId = review.storeId;

  await db.transaction(async (tx) => {
    await tx.delete(reviewsTable).where(eq(reviewsTable.id, id));
    if (storeId) {
      await recalculateStoreRating(storeId, tx);
    }
  });

  res.status(204).send();
});

export default router;
