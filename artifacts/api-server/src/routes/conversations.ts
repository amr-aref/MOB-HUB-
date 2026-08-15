import { randomUUID } from "crypto";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  chatMessagesTable,
  storesTable,
  usersTable,
} from "@workspace/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { createNotification } from "../services/notificationService";
import { requireAuth } from "../middlewares/authenticate";

const router: IRouter = Router();

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

/** Express may type route params as string | string[]; normalize to a single string. */
function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

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

/** Resolve merchant user id for a store (users.storeId === storeId). */
async function resolveMerchantUserId(storeId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.storeId, storeId))
    .limit(1);
  return user?.id ?? null;
}

/**
 * Participant check using authenticated identity only.
 * Buyer: req.user.sub === conversation.buyerId
 * Merchant: req.user.storeId === conversation.storeId (or admin/moderator)
 */
function isConversationParticipant(
  conv: typeof conversationsTable.$inferSelect,
  user: NonNullable<Express.Request["user"]>,
): boolean {
  if (user.role === "admin" || user.role === "moderator") return true;
  if (conv.buyerId === user.sub) return true;
  if (user.storeId && conv.storeId === user.storeId) return true;
  return false;
}

router.use(requireAuth);

// GET /conversations — list for authenticated buyer and/or merchant store.
router.get("/conversations", async (req, res) => {
  const user = req.user!;
  const conditions = [];

  const isMerchantSide =
    ["merchant", "admin", "moderator"].includes(user.role) && !!user.storeId;

  if (isMerchantSide) {
    conditions.push(eq(conversationsTable.storeId, user.storeId!));
  } else {
    conditions.push(eq(conversationsTable.buyerId, user.sub));
  }

  const rows = await db
    .select()
    .from(conversationsTable)
    .where(and(...conditions))
    .orderBy(desc(conversationsTable.lastMessageAt));

  res.json(rows.map(toConversationDto));
});

// GET /conversations/:id
router.get("/conversations/:id", async (req, res) => {
  const id = routeParam(req.params.id);
  const user = req.user!;

  const [row] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!row || !isConversationParticipant(row, user)) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json(toConversationDto(row));
});

// POST /conversations — buyer creates; buyerId always from session.
router.post("/conversations", async (req, res) => {
  const user = req.user!;
  const { storeId, productId, productNameAr, productNameEn } =
    req.body as Record<string, string | undefined>;

  if (!storeId) {
    res.status(400).json({ error: "storeId is required" });
    return;
  }

  // Only buyers (or admins acting as buyers) open buyer-side conversations.
  // Merchant must not invent a buyerId.
  const buyerId = user.sub;

  const [store] = await db
    .select({ id: storesTable.id })
    .from(storesTable)
    .where(eq(storesTable.id, storeId));

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const conditions = [
    eq(conversationsTable.buyerId, buyerId),
    eq(conversationsTable.storeId, storeId),
  ];
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

  const welcomeContent = productNameAr
    ? `محادثة حول: ${productNameAr}`
    : "محادثة جديدة / New conversation";

  const now = new Date();
  const convId = generateId("conv");

  const created = await db.transaction(async (tx) => {
    const [conv] = await tx
      .insert(conversationsTable)
      .values({
        id: convId,
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

    await tx.insert(chatMessagesTable).values({
      id: generateId("msg"),
      conversationId: convId,
      senderType: "system",
      senderId: "system",
      type: "system",
      content: welcomeContent,
      status: "read",
      createdAt: now,
    });

    return conv;
  });

  res.status(201).json(toConversationDto(created));
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const id = routeParam(req.params.id);
  const user = req.user!;

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!conv || !isConversationParticipant(conv, user)) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt)
    .limit(200);

  res.json(messages.map(toChatMessageDto));
});

// POST /conversations/:id/messages
// sender identity is derived from the session — never from client body.
router.post("/conversations/:id/messages", async (req, res) => {
  const id = routeParam(req.params.id);
  const user = req.user!;
  const { content, type = "text" } = req.body as Record<string, string | undefined>;

  if (!content) {
    res.status(400).json({ error: "content is required" });
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

  if (!conv || !isConversationParticipant(conv, user)) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Derive sender from session only. Clients cannot send as system or as another user.
  let senderType: "buyer" | "seller";
  let senderId: string;

  if (conv.buyerId === user.sub) {
    senderType = "buyer";
    senderId = user.sub;
  } else if (user.storeId && conv.storeId === user.storeId) {
    senderType = "seller";
    // Persist storeId as senderId for seller-side messages (conversation model).
    senderId = conv.storeId;
  } else if (user.role === "admin" || user.role === "moderator") {
    // Moderators act as seller side for support tooling.
    senderType = "seller";
    senderId = conv.storeId;
  } else {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const now = new Date();
  const msgId = generateId("msg");
  const trimmedContent = content.trim();

  const created = await db.transaction(async (tx) => {
    const [msg] = await tx
      .insert(chatMessagesTable)
      .values({
        id: msgId,
        conversationId: id,
        senderType,
        senderId,
        type: type ?? "text",
        content: trimmedContent,
        status: "sent",
        createdAt: now,
      })
      .returning();

    await tx
      .update(conversationsTable)
      .set({
        lastMessageText: trimmedContent,
        lastMessageAt: now,
        updatedAt: now,
        ...(senderType === "buyer"
          ? { sellerUnreadCount: sql`${conversationsTable.sellerUnreadCount} + 1` }
          : { buyerUnreadCount: sql`${conversationsTable.buyerUnreadCount} + 1` }),
      })
      .where(eq(conversationsTable.id, id));

    return msg;
  });

  // Notify the other participant. Merchant side uses merchant USER id, not storeId.
  if (senderType === "buyer" || senderType === "seller") {
    const preview =
      trimmedContent.length > 80
        ? `${trimmedContent.slice(0, 80)}…`
        : trimmedContent;

    const recipientId =
      senderType === "buyer"
        ? await resolveMerchantUserId(conv.storeId)
        : conv.buyerId;

    if (recipientId) {
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
  }

  res.status(201).json(toChatMessageDto(created));
});

// PATCH /conversations/:id/read — reader type derived from session.
router.patch("/conversations/:id/read", async (req, res) => {
  const id = routeParam(req.params.id);
  const user = req.user!;

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));

  if (!conv || !isConversationParticipant(conv, user)) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const isBuyer = conv.buyerId === user.sub;
  const resetField = isBuyer
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
