import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// ─── user_devices ─────────────────────────────────────────────────────────────
// Registry of known devices per user.  Enables per-device logout and
// suspicious device detection.  deviceId is the same opaque ID already used
// by the mobile app's useDeviceId hook — bridging pre-auth and post-auth
// identity without a data migration.

export const userDevicesTable = pgTable(
  "user_devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Opaque device UUID (from AsyncStorage / expo-secure-store) */
    deviceId: text("device_id").notNull(),
    platform: text("platform"),
    deviceName: text("device_name"),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_devices_user_id_idx").on(table.userId),
    index("user_devices_device_id_idx").on(table.deviceId),
  ],
);

export const insertUserDeviceSchema = createInsertSchema(userDevicesTable);
export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type UserDevice = typeof userDevicesTable.$inferSelect;
