import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as mock from "@/lib/mock-store";
import type { PackageStatus } from "@/lib/types";

const isMock = process.env.USE_MOCK === "true";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "bookkeeper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const filter = searchParams.get("filter") ?? "";

  if (isMock) {
    let clients = mock.getAllClients();

    if (search) {
      clients = clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.companyName?.toLowerCase().includes(search)
      );
    }

    if (filter) {
      clients = clients.filter((c) => {
        if (filter === "no_uploads") return c.statementCount === 0;
        if (filter === "incomplete") return c.latestPackageStatus === "need_statements";
        return c.latestPackageStatus === filter;
      });
    }

    // Sort by most recent activity
    clients.sort((a, b) => {
      if (!a.latestActivity && !b.latestActivity) return 0;
      if (!a.latestActivity) return 1;
      if (!b.latestActivity) return -1;
      return new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime();
    });

    return NextResponse.json(clients);
  }

  const { db } = await import("@/lib/db");
  const {
    users,
    monthlyPackages,
    statements,
  } = await import("@/lib/db/schema");
  const { eq, desc, count, sql } = await import("drizzle-orm");

  // Get all clients with aggregated data
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: users.companyName,
      statementCount: count(statements.id),
    })
    .from(users)
    .leftJoin(monthlyPackages, eq(monthlyPackages.userId, users.id))
    .leftJoin(statements, eq(statements.monthlyPackageId, monthlyPackages.id))
    .where(eq(users.role, "client"))
    .groupBy(users.id)
    .orderBy(desc(sql`max(${monthlyPackages.createdAt})`));

  // For each client, get latest package status
  const result: Array<{
    id: string;
    name: string | null;
    email: string;
    companyName: string | null;
    latestActivity: string | null;
    latestPackageStatus: PackageStatus | null;
    statementCount: number;
  }> = [];

  for (const row of rows) {
    // Apply search filter in JS for production (simpler than building dynamic where clauses)
    if (search) {
      const matches =
        row.name?.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search) ||
        row.companyName?.toLowerCase().includes(search);
      if (!matches) continue;
    }

    const latestPkg = await db.query.monthlyPackages.findFirst({
      where: eq(monthlyPackages.userId, row.id),
      orderBy: [desc(monthlyPackages.year), desc(monthlyPackages.month)],
    });

    const entry = {
      id: row.id,
      name: row.name,
      email: row.email,
      companyName: row.companyName,
      latestActivity: latestPkg?.createdAt?.toISOString() ?? null,
      latestPackageStatus: (latestPkg?.status as PackageStatus) ?? null,
      statementCount: Number(row.statementCount),
    };

    // Apply filter
    if (filter) {
      if (filter === "no_uploads" && entry.statementCount !== 0) continue;
      if (filter === "incomplete" && entry.latestPackageStatus !== "need_statements") continue;
      if (filter !== "no_uploads" && filter !== "incomplete" && entry.latestPackageStatus !== filter) continue;
    }

    result.push(entry);
  }

  return NextResponse.json(result);
}
