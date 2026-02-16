import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isMock) {
    const sub = mock.getSubscriptionForUser(session.user.id);
    return NextResponse.json(sub);
  }

  const { db } = await import("@/lib/db");
  const { subscriptions } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const activeSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, session.user.id),
      eq(subscriptions.status, "active")
    ),
  });

  if (!activeSub) {
    return NextResponse.json({
      hasActiveSubscription: false,
      subscriptionName: null,
      subscriptionAmount: null,
      lastSyncedAt: null,
    });
  }

  return NextResponse.json({
    hasActiveSubscription: true,
    subscriptionName: activeSub.name,
    subscriptionAmount: activeSub.amount,
    lastSyncedAt: activeSub.lastSyncedAt?.toISOString() ?? null,
  });
}
