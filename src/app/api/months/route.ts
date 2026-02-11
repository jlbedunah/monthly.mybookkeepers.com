import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMonthSchema } from "@/lib/validations";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isMock) {
    return NextResponse.json(mock.getPackagesForUser(session.user.id));
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
    .where(eq(monthlyPackages.userId, session.user.id))
    .groupBy(monthlyPackages.id)
    .orderBy(desc(monthlyPackages.year), desc(monthlyPackages.month));

  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMonthSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (isMock) {
    const existing = mock.findPackageByMonth(
      session.user.id, parsed.data.month, parsed.data.year
    );
    if (existing) return NextResponse.json(existing, { status: 409 });
    const pkg = mock.createPackage(session.user.id, parsed.data.month, parsed.data.year);
    return NextResponse.json(pkg, { status: 201 });
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const existing = await db.query.monthlyPackages.findFirst({
    where: and(
      eq(monthlyPackages.userId, session.user.id),
      eq(monthlyPackages.month, parsed.data.month),
      eq(monthlyPackages.year, parsed.data.year)
    ),
  });

  if (existing) {
    return NextResponse.json(existing, { status: 409 });
  }

  const [pkg] = await db
    .insert(monthlyPackages)
    .values({
      userId: session.user.id,
      month: parsed.data.month,
      year: parsed.data.year,
    })
    .returning();

  return NextResponse.json({ ...pkg, statements: [] }, { status: 201 });
}
