import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; monthId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "bookkeeper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, monthId } = await params;

  if (isMock) {
    const pkg = mock.getPackageByIdUnscoped(monthId);
    if (!pkg || pkg.userId !== clientId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(pkg);
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const pkg = await db.query.monthlyPackages.findFirst({
    where: and(
      eq(monthlyPackages.id, monthId),
      eq(monthlyPackages.userId, clientId)
    ),
    with: { statements: true },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(pkg);
}
