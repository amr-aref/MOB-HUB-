import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

// ─── conversations ────────────────────────────────────────────────────────────
// One conversation per (buyerId + storeId + productId?) triple.
// buyerId is a device-level UUID (auth-ready field; replace with user FK later).

export const conversationsTable = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id").notNull(),
    // Optional: conversation is linked to a specific product enquiry.
    productId: text("product_id"),
    productNameAr: text("product_name_ar"),
    productNameEn: text("product_name_en"),
    // Denormalised cache for conversation list rendering (avoids JOIN on every list load).
    lastMessageText: text("last_message_text"),
    lastMessageAt: timestamp("last_message_at"),
    // Unread counts from each participant's perspective.
    buyerUnreadCount: integer("buyer_unread_count").notNull().default(0),
    sellerUnreadCount: integer("seller_unread_count").notNull().default(0),
    status: text("status").notNull().default("active"), // active | archived | deleted
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Buyer inbox: GET /conversations?buyerId=X ordered by lastMessageAt
    index("conversations_buyer_id_idx").on(table.buyerId),
    // Seller inbox: GET /conversations?storeId=X
    index("conversations_store_id_idx").on(table.storeId),
    // ORDER BY lastMessageAt DESC used on every list query
    index("conversations_last_message_at_idx").on(table.lastMessageAt),
    // Idempotent create lookup: buyerId + storeId + productId
    index("conversations_buyer_store_product_idx").on(
      table.buyerId,
      table.storeId,
      table.productId,
    ),
  ],
);

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  store: one(storesTable, {
    fields: [conversationsTable.storeId],
    references: [storesTable.id],
  }),
  messages: many(chatMessagesTable),
}));

// ─── chat_messages ────────────────────────────────────────────────────────────
// Individual messages within a conversation.

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    // senderType: 'buyer' | 'seller' | 'system'
    senderType: text("sender_type").notNull(),
    // senderId: device UUID for buyer, storeId for seller, 'system' for system msgs.
    senderId: text("sender_id").notNull(),
    // type: 'text' | 'image' | 'system'
    type: text("type").notNull().default("text"),
    content: text("content").notNull(),
    // status: 'sent' | 'delivered' | 'read'
    status: text("status").notNull().default("sent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // GET /conversations/:id/messages ORDER BY createdAt
    index("chat_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [chatMessagesTable.conversationId],
    references: [conversationsTable.id],
  }),
}));

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const insertConversationSchema = createInsertSchema(conversationsTable);
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable);
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
