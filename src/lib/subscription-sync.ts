/**
 * Subscription sync orchestration and overdue detection.
 */

import {
  getActiveSubscriptionIds,
  getSubscriptionDetailsBatch,
} from "./authorizenet";

/**
 * Sync active subscriptions from Authorize.net into the local DB.
 * Returns a summary of the sync operation.
 */
export async function syncSubscriptions(triggeredBy: "cron" | "manual") {
  const { db } = await import("@/lib/db");
  const { subscriptions, users } = await import("@/lib/db/schema");
  const { eq, sql, notInArray } = await import("drizzle-orm");

  console.log(`[subscription-sync] Starting sync (triggered by ${triggeredBy})`);

  // 1. Get all active subscription IDs from Authorize.net
  const activeIds = await getActiveSubscriptionIds();
  console.log(`[subscription-sync] Found ${activeIds.length} active subscriptions`);

  // 2. Fetch details in batches
  const details = await getSubscriptionDetailsBatch(activeIds, 5);

  // 3. Upsert each subscription
  for (const detail of details) {
    await db
      .insert(subscriptions)
      .values({
        arbSubscriptionId: detail.arbSubscriptionId,
        name: detail.name,
        billingEmail: detail.billingEmail,
        amount: detail.amount,
        status: detail.status as "active" | "expired" | "suspended" | "canceled" | "terminated",
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.arbSubscriptionId,
        set: {
          name: detail.name,
          billingEmail: detail.billingEmail,
          amount: detail.amount,
          status: detail.status as "active" | "expired" | "suspended" | "canceled" | "terminated",
          lastSyncedAt: new Date(),
        },
      });
  }

  // 4. Match users: link subscriptions to users by billing email
  await db.execute(sql`
    UPDATE subscriptions s
    SET user_id = u.id
    FROM users u
    WHERE LOWER(s.billing_email) = LOWER(u.billing_email)
      AND u.billing_email IS NOT NULL
      AND s.billing_email IS NOT NULL
  `);

  // Clear user_id for subscriptions that no longer match
  await db.execute(sql`
    UPDATE subscriptions s
    SET user_id = NULL
    WHERE s.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = s.user_id
          AND LOWER(u.billing_email) = LOWER(s.billing_email)
      )
  `);

  // 5. Mark stale: active subs in DB not in the fetched list → expired
  if (activeIds.length > 0) {
    await db
      .update(subscriptions)
      .set({ status: "expired", lastSyncedAt: new Date() })
      .where(
        sql`${subscriptions.status} = 'active' AND ${subscriptions.arbSubscriptionId} NOT IN (${sql.join(
          activeIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
  } else {
    // If no active subs returned, expire all currently active
    await db
      .update(subscriptions)
      .set({ status: "expired", lastSyncedAt: new Date() })
      .where(eq(subscriptions.status, "active"));
  }

  // Count matched users
  const matched = await db
    .select({ count: sql<number>`count(DISTINCT user_id)` })
    .from(subscriptions)
    .where(sql`${subscriptions.userId} IS NOT NULL AND ${subscriptions.status} = 'active'`);

  const matchedUsers = Number(matched[0]?.count ?? 0);

  console.log(
    `[subscription-sync] Sync complete: ${details.length} subscriptions, ${matchedUsers} matched users`
  );

  return { totalSubscriptions: details.length, matchedUsers };
}

/**
 * Check which clients are overdue (no active subscription) and send notifications.
 * Called after the sync on the 4th of the month.
 */
export async function checkOverdueAndNotify() {
  const { db } = await import("@/lib/db");
  const { users, subscriptions } = await import("@/lib/db/schema");
  const { eq, sql } = await import("drizzle-orm");
  const {
    sendOverdueNotificationToClient,
    sendOverdueSummaryToBookkeeper,
  } = await import("@/lib/email");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Find clients with a billingEmail but no active subscription
  const overdueClients = await db.execute(sql`
    SELECT u.id, u.name, u.email, u.company_name, u.billing_email
    FROM users u
    WHERE u.role = 'client'
      AND u.billing_email IS NOT NULL
      AND u.billing_email != ''
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = u.id
          AND s.status = 'active'
      )
  `) as unknown as Array<{
    id: string;
    name: string | null;
    email: string;
    company_name: string | null;
    billing_email: string;
  }>;

  if (overdueClients.length === 0) {
    console.log("[subscription-sync] No overdue clients found");
    return { overdueCount: 0 };
  }

  console.log(`[subscription-sync] ${overdueClients.length} overdue clients found`);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Email each overdue client
  const overdueList: Array<{
    clientName: string;
    companyName: string;
    billingEmail: string;
    clientEmail: string;
  }> = [];

  for (const client of overdueClients) {
    const clientName = client.name ?? "Valued Client";
    const companyName = client.company_name ?? "";

    overdueList.push({
      clientName,
      companyName,
      billingEmail: client.billing_email,
      clientEmail: client.email,
    });

    try {
      await sendOverdueNotificationToClient({
        clientName,
        clientEmail: client.email,
        companyName,
        month: MONTHS[month - 1],
        year,
      });
    } catch (err) {
      console.error(`[subscription-sync] Failed to email client ${client.email}:`, err);
    }
  }

  // Send summary to bookkeeper
  try {
    await sendOverdueSummaryToBookkeeper({
      overdueClients: overdueList,
      month: MONTHS[month - 1],
      year,
    });
  } catch (err) {
    console.error("[subscription-sync] Failed to send bookkeeper summary:", err);
  }

  return { overdueCount: overdueClients.length };
}

/**
 * Check if a client has an active subscription.
 */
export async function hasActiveSubscription(clientId: string): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const { subscriptions } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const result = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, clientId),
      eq(subscriptions.status, "active")
    ),
  });

  return !!result;
}

/**
 * Link/unlink subscriptions for a specific user based on billing email.
 * Called after a user updates their billing email.
 */
export async function relinkSubscriptionsForUser(
  userId: string,
  billingEmail: string | null
) {
  const { db } = await import("@/lib/db");
  const { subscriptions } = await import("@/lib/db/schema");
  const { eq, sql } = await import("drizzle-orm");

  // First, unlink any subscriptions currently pointing to this user
  await db
    .update(subscriptions)
    .set({ userId: null })
    .where(eq(subscriptions.userId, userId));

  // Then, link subscriptions matching the new billing email
  if (billingEmail) {
    await db.execute(sql`
      UPDATE subscriptions
      SET user_id = ${userId}
      WHERE LOWER(billing_email) = LOWER(${billingEmail})
    `);
  }
}
