import { NextResponse } from "next/server";
import { startMonthlySchema } from "@/lib/validations";
import { createARBSubscription } from "@/lib/authorizenet";
import { Resend } from "resend";

const INITIAL_AMOUNT = 1;
const SUBSCRIPTION_AMOUNT = 189;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = startMonthlySchema.safeParse(body);

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldErrors = Object.entries(flat.fieldErrors)
      .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
      .join("; ");
    return NextResponse.json(
      { error: fieldErrors || "Validation failed", details: flat },
      { status: 400 }
    );
  }

  const { name, email, companyName, opaqueData } = parsed.data;

  const { db } = await import("@/lib/db");
  const { users, subscriptions } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in instead." },
      { status: 409 }
    );
  }

  // Create ARB subscription in Authorize.net
  const result = await createARBSubscription({
    name,
    email,
    companyName,
    opaqueData,
    amount: SUBSCRIPTION_AMOUNT,
    initialAmount: INITIAL_AMOUNT,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  console.log(
    `[start-monthly] Success: txn=${result.transactionId}, sub=${result.subscriptionId}`
  );

  // Create user in DB
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      companyName,
      billingEmail: email.toLowerCase(),
      role: "client",
    })
    .returning({ id: users.id });

  // Create subscription record
  await db.insert(subscriptions).values({
    arbSubscriptionId: result.subscriptionId,
    name: `${companyName} Monthly Bookkeeping`,
    billingEmail: email.toLowerCase(),
    amount: String(SUBSCRIPTION_AMOUNT),
    status: "active",
    userId: newUser.id,
  });

  // Send magic link email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate a NextAuth sign-in URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://monthly.mybookkeepers.com";

    // Create a verification token for email sign-in
    const { createHash, randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256")
      .update(`${token}${process.env.AUTH_SECRET}`)
      .digest("hex");

    const { verificationTokens } = await import("@/lib/db/schema");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(verificationTokens).values({
      identifier: email.toLowerCase(),
      token: hashedToken,
      expires,
    });

    const callbackUrl = encodeURIComponent("/dashboard");
    const signInUrl = `${baseUrl}/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(email.toLowerCase())}&callbackUrl=${callbackUrl}`;

    await resend.emails.send({
      from: "MyBookkeepers.com <noreply@mybookkeepers.com>",
      to: email,
      subject: "Sign in to MyBookkeepers.com",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#991b1b">Welcome to MyBookkeepers.com!</h2>
          <p>Hi ${name},</p>
          <p>Your subscription has been set up successfully. Click the link below to sign in to your bookkeeping portal:</p>
          <p style="margin:24px 0">
            <a href="${signInUrl}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Sign in to your portal
            </a>
          </p>
          <p style="color:#6b7280;font-size:14px">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
          <p style="margin-top:24px;color:#6b7280;font-size:14px">— The MyBookkeepers.com Team</p>
        </div>
      `,
    });
  } catch (err) {
    // Don't fail the whole request if email fails — subscription is already created
    console.error("[start-monthly] Failed to send magic link email:", err);
  }

  return NextResponse.json({ success: true });
}
