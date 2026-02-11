import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sid } = await params;

  if (isMock) {
    const pkg = mock.getPackageById(id, session.user.id);
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pkg.status !== "need_statements") {
      return NextResponse.json(
        { error: "Cannot delete statements in current status" },
        { status: 400 }
      );
    }
    const stmt = mock.findStatement(sid, id);
    if (!stmt) return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    mock.removeStatement(sid);
    return NextResponse.json({ success: true });
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages, statements } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const { del } = await import("@vercel/blob");

  const pkg = await db.query.monthlyPackages.findFirst({
    where: and(
      eq(monthlyPackages.id, id),
      eq(monthlyPackages.userId, session.user.id)
    ),
  });

  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pkg.status !== "need_statements") {
    return NextResponse.json(
      { error: "Cannot delete statements in current status" },
      { status: 400 }
    );
  }

  const statement = await db.query.statements.findFirst({
    where: and(eq(statements.id, sid), eq(statements.monthlyPackageId, id)),
  });
  if (!statement) return NextResponse.json({ error: "Statement not found" }, { status: 404 });

  await del(statement.fileUrl);
  await db.delete(statements).where(eq(statements.id, sid));

  return NextResponse.json({ success: true });
}
