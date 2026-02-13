import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "bookkeeper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  if (isMock) {
    const packages = mock.getPackagesForUser(clientId);
    return NextResponse.json(packages);
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages, statements } = await import("@/lib/db/schema");
  const { eq, desc, count } = await import("drizzle-orm");

  const packages = await db
    .select({
      id: monthlyPackages.id,
      month: monthlyPackages.month,
      year: monthlyPackages.year,
      status: monthlyPackages.status,
      statementCount: count(statements.id),
    })
    .from(monthlyPackages)
    .leftJoin(statements, eq(statements.monthlyPackageId, monthlyPackages.id))
    .where(eq(monthlyPackages.userId, clientId))
    .groupBy(monthlyPackages.id)
    .orderBy(desc(monthlyPackages.year), desc(monthlyPackages.month));

  return NextResponse.json(packages);
}
