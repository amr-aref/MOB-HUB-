import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  chatMessagesTable,
  storesTable,
} from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { createNotification } from "../services/notificationService";

const router: IRouter = Router();

// ─── DTO helpers ──────────────────────────────────────────────────────────────

export function toConversationDto(row: typeof conversationsTable.$inferSelect) {
  return {
    id: row.id,
    storeId: row.storeId,
    buyerId: row.buyerId,
    productId: row.productId ?? null,
    productNameAr: row.productNameAr ?? null,
    productNameEn: row.productNameEn ?? null,
    lastMessageText: row.lastMessageText ?? null,
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    buyerUnreadCount: row.buyerUnreadCount,
    sellerUnreadCount: row.sellerUnreadCount,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toChatMessageDto(row: typeof chatMessagesTable.$inferSelect) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderType: row.senderType,
    senderId: row.senderId,
    type: row.type,
    content: row.content,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── ID helper ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── GET /conversations ───────────────────────────────────────────────────────
// List all conversations for a buyer (or for a store from the seller side).
// Query params: buyerId, storeId (at least one required)

router.get("/conversations", async (req, res) => {
  const { buyerId, storeId } = req.query as Record<string, string | undefined>;

  if (!buyerId && !storeId) {
    res.status(400).json({ error: "At least one of buyerId or storeId is required" });
    return;
  }

  const conditions = [];
  if (buyerId) conditions.push(eq(conversationsTable.buyerId, buyerId));
  if (storeId) conditions.push(eq(conversationsTable.storeId, storeId));

  const rows = await db
    .select()
    .from(conversationsTable)
    .where(and(...conditions))
    .orderBy(desc(conversationsTable.lastMessageAt));

  res.json(rows.map(toConversationDto));
});

// ─── GET /conversations/:id ───────────────────────────────────────────────────
// Fetch a single conversation. Requires buyerId or storeId for participant check.

router.get("/conversations/:id", async (req, res) => {
  const { id } = req.params;
  const { buyerId, storeId } = req.query as Record<string, string | undefined>;

  const [row] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Participant check: caller must be the buyer OR the store.
  const isParticipant =
    (buyerId && row.buyerId === buyerId) || (storeId && row.storeId === storeId);

  if (!isParticipant) {
    res.status(403).json({ error: "Access denied — not a conversation participant" });
    return;
  }

  res.json(toConversationDto(row));
});

// ─── POST /conversations ──────────────────────────────────────────────────────
// Create or return an existing conversation (idempotent by buyerId+storeId+productId).
// Body: { buyerId, storeId, productId?, productNameAr?, productNameEn? }

router.post("/conversations", async (req, res) => {
  const { buyerId, storeId, productId, productNameAr, productNameEn } =
    req.body as Record<string, string | undefined>;

  if (!buyerId || !storeId) {
    res.status(400).json({ error: "buyerId and storeId are required" });
    return;
  }

  // Verify store exists.
  const [store] = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(eq(storesTable.id, storeId));

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  // Idempotency: look up existing conversation for this triple.
  const conditions = [
    eq(conversationsTable.buyerId, buyerId),
    eq(conversationsTable.storeId, storeId),
  ];

  // When a productId is provided, scope the lookup to that product.
  // A buyer can have one conversation per product per store.
  if (productId) {
    conditions.push(eq(conversationsTable.productId, productId));
  }

  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(and(...conditions));

  if (existing) {
    res.status(200).json(toConversationDto(existing));
    return;
  }

  // Create new conversation — system welcome message inserted atomically.
  const id = generateId("conv");
  const now = new Date();

  const welcomeContent = productNameAr
    ? `محادثة حول: ${productNameAr}`
    : "محادثة جديدة / New conversation";

  const [created] = await db
    .insert(conversationsTable)
    .values({
      id,
      storeId,
      buyerId,
      productId: productId ?? null,
      productNameAr: productNameAr ?? null,
      productNameEn: productNameEn ?? null,
      lastMessageText: welcomeContent,
      lastMessageAt: now,
      buyerUnreadCount: 0,
      sellerUnreadCount: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // System welcome message.
  await db.insert(chatMessagesTable).values({
    id: generateId("msg"),
    conversationId: id,
    senderType: "system",
    senderId: "system",
    type: "system",
    content: welcomeContent,
    status: "read",
    createdAt: now,
  });

  res.status(201).json(toConversationDto(created));
});

// ─── GET /conversations/:id/messages ─────────────────────────────────────────
// List all messages in a conversation (chronological).
// Requires buyerId or storeId for participant check.

router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { buyerId, storeId } = req.query as Record<string, string | undefined>;

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const isParticipant =
    (buyerId && conv.buyerId === buyerId) || (storeId && conv.storeId === storeId);

  if (!isParticipant) {
    res.status(403).json({ error: "Access denied — not a conversation participant" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages.map(toChatMessageDto));
});

// ─── POST /conversations/:id/messages ────────────────────────────────────────
// Send a message.
// Body: { senderId, senderType, content, type? }

router.post("/conversations/:id/messages", async (req, res) => {
  const { id } = req.params;
  const {
    senderId,
    senderType,
    content,
    type = "text",
  } = req.body as Record<string, string | undefined>;

  if (!senderId || !senderType || !content) {
    res.status(400).json({ error: "senderId, senderType, and content are required" });
    return;
  }

  if (!["buyer", "seller", "system"].includes(senderType)) {
    res.status(400).json({ error: "senderType must be buyer, seller, or system" });
    return;
  }

  if (content.trim().length === 0) {
    res.status(400).json({ error: "Message content cannot be empty" });
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ error: "Message is too long (max 2000 characters)" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Participant check.
  const isBuyer = senderType === "buyer" && conv.buyerId === senderId;
  const isSeller = senderType === "seller" && conv.storeId === senderId;

  if (!isBuyer && !isSeller && senderType !== "system") {
    res.status(403).json({ error: "Access denied — not a conversation participant" });
    return;
  }

  const now = new Date();
  const msgId = generateId("msg");

  const [created] = await db
    .insert(chatMessagesTable)
    .values({
      id: msgId,
      conversationId: id,
      senderType,
      senderId,
      type: type ?? "text",
      content: content.trim(),
      status: "sent",
      createdAt: now,
    })
    .returning();

  // Update conversation: denormalised last message + increment opposite unread count.
  const unreadUpdate =
    senderType === "buyer"
      ? { sellerUnreadCount: conv.sellerUnreadCount + 1 }
      : { buyerUnreadCount: conv.buyerUnreadCount + 1 };

  await db
    .update(conversationsTable)
    .set({
      lastMessageText: content.trim(),
      lastMessageAt: now,
      updatedAt: now,
      ...unreadUpdate,
    })
    .where(eq(conversationsTable.id, id));

  // Notify the other participant (Notification Types: New Message).
  if (senderType === "buyer" || senderType === "seller") {
    const recipientId = senderType === "buyer" ? conv.storeId : conv.buyerId;
    const preview = content.trim().length > 80 ? `${content.trim().slice(0, 80)}…` : content.trim();

    await createNotification({
      userId: recipientId,
      type: "new_message",
      titleAr: "رسالة جديدة",
      titleEn: "New Message",
      bodyAr: preview,
      bodyEn: preview,
      metadata: { conversationId: id, senderType, senderId },
    });
  }

  res.status(201).json(toChatMessageDto(created));
});

// ─── PATCH /conversations/:id/read ───────────────────────────────────────────
// Mark conversation as read from one participant's perspective.
// Body: { readerType: 'buyer' | 'seller' }

router.patch("/conversations/:id/read", async (req, res) => {
  const { id } = req.params;
  const { readerType } = req.body as { readerType?: string };

  if (!readerType || !["buyer", "seller"].includes(readerType)) {
    res.status(400).json({ error: "readerType must be buyer or seller" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const resetField =
    readerType === "buyer"
      ? { buyerUnreadCount: 0, updatedAt: new Date() }
      : { sellerUnreadCount: 0, updatedAt: new Date() };

  const [updated] = await db
    .update(conversationsTable)
    .set(resetField)
    .where(eq(conversationsTable.id, id))
    .returning();

  res.json(toConversationDto(updated));
});

export default router;
