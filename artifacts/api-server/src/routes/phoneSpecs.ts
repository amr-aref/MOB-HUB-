import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { phoneSpecsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/** Map DB columns to the camelCase DTO expected by the mobile app */
function toPhoneSpecDto(row: typeof phoneSpecsTable.$inferSelect) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    os: row.os,
    processor: row.processor,
    ram: row.ram,
    storage: row.storage,
    displaySize: row.displaySize,
    displayType: row.displayType,
    resolution: row.resolution,
    refreshRate: row.refreshRate,
    brightness: row.brightness,
    rearCamera: row.rearCamera,
    frontCamera: row.frontCamera,
    videoRecording: row.videoRecording,
    battery: row.battery,
    charging: row.charging,
    wirelessCharging: row.wirelessCharging,
    reverseCharging: row.reverseCharging,
    fingerprint: row.fingerprint,
    faceUnlock: row.faceUnlock,
    waterResistance: row.waterResistance,
    weight: row.weight,
    dimensions: row.dimensions,
    fiveG: row.fiveG,
    nfc: row.nfc,
    bluetooth: row.bluetooth,
    wifi: row.wifi,
    usb: row.usb,
    audioJack: row.audioJack,
    colors: row.colors,
    priceEGP: row.priceEGP,
    releaseDate: row.releaseDate,
    _batteryMah: row.batteryMah,
    _chargingW: row.chargingW,
    _refreshRateHz: row.refreshRateHz,
    _rearMp: row.rearMp,
    _ramGb: row.ramGb,
    _displayInch: row.displayInch,
  };
}

// GET /phone-specs
router.get("/phone-specs", async (_req, res) => {
  const rows = await db.select().from(phoneSpecsTable);
  res.json(rows.map(toPhoneSpecDto));
});

// GET /phone-specs/:id
router.get("/phone-specs/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(phoneSpecsTable)
    .where(eq(phoneSpecsTable.id, req.params.id));
  if (!rows[0]) {
    res.status(404).json({ error: "Phone spec not found" });
    return;
  }
  res.json(toPhoneSpecDto(rows[0]));
});

export default router;
