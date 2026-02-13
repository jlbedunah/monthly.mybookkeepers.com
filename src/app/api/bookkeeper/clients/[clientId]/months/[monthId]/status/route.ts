import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updatePackageStatusSchema } from "@/lib/validations";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string; monthId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "bookkeeper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, monthId } = await params;
  const body = await request.json();
  const parsed = updatePackageStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (isMock) {
    const pkg = mock.getPackageByIdUnscoped(monthId);
    if (!pkg || pkg.userId !== clientId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    mock.updatePackageStatus(monthId, parsed.data.status);

    if (parsed.data.status === "finished") {
      const user = mock.findUserById(clientId);
      console.log(
        `[Mock] Would email ${user?.email}: bookkeeping for ${MONTHS[pkg.month - 1]} ${pkg.year} is complete`
      );
    }

    return NextResponse.json({ success: true, status: parsed.data.status });
  }

  const { db } = await import("@/lib/db");
  const { monthlyPackages, users } = await import("@/lib/db/schema");
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

  await db
    .update(monthlyPackages)
    .set({ status: parsed.data.status })
    .where(eq(monthlyPackages.id, monthId));

  // Send completion email to client when status is set to "finished"
  if (parsed.data.status === "finished") {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, clientId),
      });
      if (user?.email) {
        const { sendCompletionNotification } = await import("@/lib/email");
        await sendCompletionNotification({
          clientName: user.name ?? "",
          clientEmail: user.email,
          companyName: user.companyName ?? "",
          month: MONTHS[pkg.month - 1],
          year: pkg.year,
        });
      }
    } catch (err) {
      console.error("Failed to send completion email:", err);
    }
  }

  return NextResponse.json({ success: true, status: parsed.data.status });
}
