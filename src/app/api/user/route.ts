import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isMock) {
    const user = mock.findUserById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      qboName: user.qboName,
      phone: user.phone,
      billingEmail: user.billingEmail,
    });
  }

  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true, name: true, email: true,
      companyName: true, qboName: true, phone: true,
      billingEmail: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (isMock) {
    const updated = mock.updateUser(session.user.id, parsed.data);
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      id: updated.id, name: updated.name, email: updated.email,
      companyName: updated.companyName, qboName: updated.qboName, phone: updated.phone,
      billingEmail: updated.billingEmail,
    });
  }

  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const [updated] = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id, name: users.name, email: users.email,
      companyName: users.companyName, qboName: users.qboName, phone: users.phone,
      billingEmail: users.billingEmail,
    });

  // On-save matching: link/unlink subscriptions for this user immediately
  if (parsed.data.billingEmail !== undefined) {
    try {
      const { relinkSubscriptionsForUser } = await import("@/lib/subscription-sync");
      await relinkSubscriptionsForUser(
        session.user.id,
        updated.billingEmail || null
      );
    } catch (err) {
      console.error("Failed to relink subscriptions:", err);
    }
  }

  return NextResponse.json(updated);
}
