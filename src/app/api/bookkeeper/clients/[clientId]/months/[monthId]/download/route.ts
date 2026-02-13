import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { zipSync, strToU8 } from "fflate";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

const MONTH_ABBRS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function zipResponse(files: Record<string, Uint8Array>, filename: string) {
  const zipped = zipSync(files);
  return new NextResponse(zipped.buffer.slice(0) as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

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

    const user = mock.findUserById(clientId);
    const name = (user?.name ?? "client").toLowerCase().replace(/\s+/g, "-");
    const monthStr = MONTH_ABBRS[pkg.month - 1] ?? "unknown";
    const filename = `${name}-stmts-${monthStr}-${pkg.year}.zip`;

    if (pkg.statements.length === 0) {
      return NextResponse.json({ error: "No statements to download" }, { status: 400 });
    }

    const files: Record<string, Uint8Array> = {};
    for (const stmt of pkg.statements) {
      const content = `Mock statement file: ${stmt.fileName}\nInstitution: ${stmt.institutionName}\nAccount: ****${stmt.accountLast4}\nType: ${stmt.institutionType}\n`;
      files[stmt.fileName] = strToU8(content);
    }

    return zipResponse(files, filename);
  }

  // Production: fetch real files and bundle
  const { db } = await import("@/lib/db");
  const {
    monthlyPackages,
    statements: statementsTable,
    users: usersTable,
  } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");

  const pkg = await db.query.monthlyPackages.findFirst({
    where: and(
      eq(monthlyPackages.id, monthId),
      eq(monthlyPackages.userId, clientId)
    ),
  });

  if (!pkg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stmts = await db
    .select()
    .from(statementsTable)
    .where(eq(statementsTable.monthlyPackageId, monthId));

  if (stmts.length === 0) {
    return NextResponse.json({ error: "No statements to download" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, clientId),
  });

  const name = (user?.name ?? "client").toLowerCase().replace(/\s+/g, "-");
  const monthStr = MONTH_ABBRS[pkg.month - 1] ?? "unknown";
  const filename = `${name}-stmts-${monthStr}-${pkg.year}.zip`;

  const files: Record<string, Uint8Array> = {};
  await Promise.all(
    stmts.map(async (stmt: { fileUrl: string; fileName: string }) => {
      try {
        const res = await fetch(stmt.fileUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          files[stmt.fileName] = new Uint8Array(buf);
        }
      } catch {
        // Skip files that can't be fetched
      }
    })
  );

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: "Could not fetch any statement files" }, { status: 500 });
  }

  return zipResponse(files, filename);
}
