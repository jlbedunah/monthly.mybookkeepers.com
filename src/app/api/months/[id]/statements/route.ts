import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadStatementSchema } from "@/lib/validations";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import * as mock from "@/lib/mock-store";

const isMock = process.env.USE_MOCK === "true";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and status
  if (isMock) {
    const pkg = mock.getPackageById(id, session.user.id);
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pkg.status !== "need_statements") {
      return NextResponse.json(
        { error: "Cannot upload statements in current status" },
        { status: 400 }
      );
    }
  } else {
    const { db } = await import("@/lib/db");
    const { monthlyPackages } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const pkg = await db.query.monthlyPackages.findFirst({
      where: and(
        eq(monthlyPackages.id, id),
        eq(monthlyPackages.userId, session.user.id)
      ),
    });
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pkg.status !== "need_statements") {
      return NextResponse.json(
        { error: "Cannot upload statements in current status" },
        { status: 400 }
      );
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const institutionName = formData.get("institutionName") as string;
  const accountLast4 = formData.get("accountLast4") as string;
  const institutionType = formData.get("institutionType") as string;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const metaParsed = uploadStatementSchema.safeParse({
    institutionName,
    accountLast4,
    institutionType,
  });
  if (!metaParsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: metaParsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use PDF, CSV, PNG, or JPG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 400 }
    );
  }

  if (isMock) {
    const statement = mock.addStatement(id, {
      institutionName: metaParsed.data.institutionName,
      accountLast4: metaParsed.data.accountLast4,
      institutionType: metaParsed.data.institutionType,
      fileUrl: `#mock-file-${file.name}`,
      fileName: file.name,
      fileSize: file.size,
    });
    return NextResponse.json(statement, { status: 201 });
  }

  const { put } = await import("@vercel/blob");
  const { db } = await import("@/lib/db");
  const { statements } = await import("@/lib/db/schema");

  const blob = await put(
    `statements/${session.user.id}/${id}/${file.name}`,
    file,
    { access: "public" }
  );

  const [statement] = await db
    .insert(statements)
    .values({
      monthlyPackageId: id,
      institutionName: metaParsed.data.institutionName,
      accountLast4: metaParsed.data.accountLast4,
      institutionType: metaParsed.data.institutionType,
      fileUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
    })
    .returning();

  return NextResponse.json(statement, { status: 201 });
}
