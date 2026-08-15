import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolve store id → merchant users.id for notification delivery.
 * Notifications are listed by authenticated users.id (req.user.sub),
 * never by stores.id. Matches conversations.ts production pattern.
 *
 * Schema allows multiple users per storeId (index only); we notify the
 * first match, same as conversations.ts.
 */
export async function resolveMerchantUserId(storeId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.storeId, storeId))
    .limit(1);
  return user?.id ?? null;
}
