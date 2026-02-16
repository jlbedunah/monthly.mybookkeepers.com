import { NextResponse } from "next/server";
import { syncSubscriptions, checkOverdueAndNotify } from "@/lib/subscription-sync";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncSubscriptions("cron");

    // On the 4th, also check for overdue clients and notify
    const day = new Date().getDate();
    let overdueResult = null;
    if (day === 4) {
      overdueResult = await checkOverdueAndNotify();
    }

    return NextResponse.json({
      success: true,
      ...result,
      overdue: overdueResult,
    });
  } catch (error) {
    console.error("[cron/sync-subscriptions] Error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
