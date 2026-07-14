import { boolean, integer, pgTable, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const phoneSpecsTable = pgTable("phone_specs", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  os: text("os").notNull(),
  processor: text("processor").notNull(),
  ram: text("ram").array().notNull().default([]),
  storage: text("storage").array().notNull().default([]),
  displaySize: text("display_size").notNull(),
  displayType: text("display_type").notNull(),
  resolution: text("resolution").notNull(),
  refreshRate: text("refresh_rate").notNull(),
  brightness: text("brightness").notNull(),
  rearCamera: text("rear_camera").notNull(),
  frontCamera: text("front_camera").notNull(),
  videoRecording: text("video_recording").notNull(),
  battery: text("battery").notNull(),
  charging: text("charging").notNull(),
  wirelessCharging: boolean("wireless_charging").notNull().default(false),
  reverseCharging: boolean("reverse_charging").notNull().default(false),
  fingerprint: boolean("fingerprint").notNull().default(false),
  faceUnlock: boolean("face_unlock").notNull().default(false),
  waterResistance: text("water_resistance").notNull(),
  weight: text("weight").notNull(),
  dimensions: text("dimensions").notNull(),
  fiveG: boolean("five_g").notNull().default(false),
  nfc: boolean("nfc").notNull().default(false),
  bluetooth: text("bluetooth").notNull(),
  wifi: text("wifi").notNull(),
  usb: text("usb").notNull(),
  audioJack: boolean("audio_jack").notNull().default(false),
  colors: text("colors").array().notNull().default([]),
  priceEGP: integer("price_egp").notNull(),
  releaseDate: text("release_date").notNull(),
  batteryMah: integer("battery_mah").notNull().default(0),
  chargingW: integer("charging_w").notNull().default(0),
  refreshRateHz: integer("refresh_rate_hz").notNull().default(0),
  rearMp: integer("rear_mp").notNull().default(0),
  ramGb: integer("ram_gb").notNull().default(0),
  displayInch: real("display_inch").notNull().default(0),
});

export const insertPhoneSpecSchema = createInsertSchema(phoneSpecsTable);
export type InsertPhoneSpec = z.infer<typeof insertPhoneSpecSchema>;
export type PhoneSpec = typeof phoneSpecsTable.$inferSelect;
