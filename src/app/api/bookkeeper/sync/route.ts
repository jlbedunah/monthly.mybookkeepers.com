import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncSubscriptions } from "@/lib/subscription-sync";

export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "bookkeeper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncSubscriptions("manual");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[bookkeeper/sync] Error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
