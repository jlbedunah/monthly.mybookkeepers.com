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
    return NextResponse.json(mock.getInstitutionsForUser(session.user.id));
  }

  const { db } = await import("@/lib/db");
  const { statements, monthlyPackages } = await import("@/lib/db/schema");
  const { eq, sql } = await import("drizzle-orm");

  const result = await db
    .selectDistinct({ institutionName: statements.institutionName })
    .from(statements)
    .innerJoin(
      monthlyPackages,
      eq(statements.monthlyPackageId, monthlyPackages.id)
    )
    .where(eq(monthlyPackages.userId, session.user.id))
    .orderBy(sql`${statements.institutionName} ASC`);

  return NextResponse.json(result.map((r: { institutionName: string }) => r.institutionName));
}
