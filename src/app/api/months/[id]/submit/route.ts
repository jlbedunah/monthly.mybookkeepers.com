import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MONTHS } from "@/lib/constants";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (isMock) {
    const pkg = mock.getPackageById(id, session.user.id);
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pkg.status !== "need_statements") {
      return NextResponse.json({ error: "Package already submitted" }, { status: 400 });
    }
    if (pkg.statements.length === 0) {
      return NextResponse.json({ error: "At least one statement is required" }, { status: 400 });
    }
    const updated = mock.submitPackage(id);
    const user = mock.findUserById(session.user.id);
    console.log(
      `[MOCK EMAIL] Submission notification for ${user?.companyName} — ${MONTHS[pkg.month - 1]} ${pkg.year} (${pkg.statements.length} statements)`
    );
    return NextResponse.json(updated);
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages, users } = await import("@/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const { sendSubmissionNotification } = await import("@/lib/email");

  const pkg = await db.query.monthlyPackages.findFirst({
    where: and(
      eq(monthlyPackages.id, id),
      eq(monthlyPackages.userId, session.user.id)
    ),
    with: { statements: true },
  });

  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pkg.status !== "need_statements") {
    return NextResponse.json({ error: "Package already submitted" }, { status: 400 });
  }
  if (pkg.statements.length === 0) {
    return NextResponse.json({ error: "At least one statement is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(monthlyPackages)
    .set({ status: "categorizing", submittedAt: new Date() })
    .where(eq(monthlyPackages.id, id))
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user) {
    try {
      await sendSubmissionNotification({
        clientName: user.name || "Unknown",
        clientEmail: user.email,
        companyName: user.companyName || "Unknown",
        month: MONTHS[pkg.month - 1],
        year: pkg.year,
        statements: pkg.statements.map((s: { institutionName: string; accountLast4: string; institutionType: string; fileName: string }) => ({
          institutionName: s.institutionName,
          accountLast4: s.accountLast4,
          institutionType: s.institutionType,
          fileName: s.fileName,
        })),
      });
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  }

  return NextResponse.json({ ...updated, statements: pkg.statements });
}
