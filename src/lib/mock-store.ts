/**
 * In-memory mock data store for local development.
 * Uses globalThis to survive Next.js hot reloads.
 */

export type MockUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  companyName: string | null;
  qboName: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MockPackage = {
  id: string;
  userId: string;
  month: number;
  year: number;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
};

export type MockStatement = {
  id: string;
  monthlyPackageId: string;
  institutionName: string;
  accountLast4: string;
  institutionType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
};

interface Store {
  users: MockUser[];
  packages: MockPackage[];
  statements: MockStatement[];
}

const g = globalThis as unknown as { __mockStore?: Store };
if (!g.__mockStore) {
  g.__mockStore = { users: [], packages: [], statements: [] };
}
const store = g.__mockStore;

// ── User operations ──

export function findUserById(id: string) {
  return store.users.find((u) => u.id === id) ?? null;
}

export function findUserByEmail(email: string) {
  return store.users.find((u) => u.email === email) ?? null;
}

export function createUser(email: string, id?: string): MockUser {
  const user: MockUser = {
    id: id ?? crypto.randomUUID(),
    name: null,
    email,
    emailVerified: new Date(),
    image: null,
    companyName: null,
    qboName: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.users.push(user);
  return user;
}

export function updateUser(
  id: string,
  data: { name?: string; companyName?: string; qboName?: string; phone?: string }
) {
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  if (data.name !== undefined) user.name = data.name;
  if (data.companyName !== undefined) user.companyName = data.companyName;
  if (data.qboName !== undefined) user.qboName = data.qboName;
  if (data.phone !== undefined) user.phone = data.phone;
  user.updatedAt = new Date();

  // Seed history once, right after onboarding completes
  if (user.name && user.companyName) {
    const hasHistory = store.packages.some((p) => p.userId === id);
    if (!hasHistory) seedHistory(id);
  }

  return user;
}

// ── Monthly Package operations ──

export function getPackagesForUser(userId: string) {
  return store.packages
    .filter((p) => p.userId === userId)
    .map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      status: p.status,
      statementCount: store.statements.filter(
        (s) => s.monthlyPackageId === p.id
      ).length,
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export function getPackageById(id: string, userId: string) {
  const pkg = store.packages.find((p) => p.id === id && p.userId === userId);
  if (!pkg) return null;
  return {
    ...pkg,
    statements: store.statements.filter((s) => s.monthlyPackageId === id),
  };
}

export function findPackageByMonth(
  userId: string,
  month: number,
  year: number
) {
  return (
    store.packages.find(
      (p) => p.userId === userId && p.month === month && p.year === year
    ) ?? null
  );
}

export function createPackage(userId: string, month: number, year: number) {
  const pkg: MockPackage = {
    id: crypto.randomUUID(),
    userId,
    month,
    year,
    status: "need_statements",
    submittedAt: null,
    createdAt: new Date(),
  };
  store.packages.push(pkg);
  return { ...pkg, statements: [] };
}

export function submitPackage(id: string) {
  const pkg = store.packages.find((p) => p.id === id);
  if (!pkg) return null;
  pkg.status = "categorizing";
  pkg.submittedAt = new Date();
  return {
    ...pkg,
    statements: store.statements.filter((s) => s.monthlyPackageId === id),
  };
}

// ── Statement operations ──

export function addStatement(
  packageId: string,
  data: {
    institutionName: string;
    accountLast4: string;
    institutionType: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }
) {
  const stmt: MockStatement = {
    id: crypto.randomUUID(),
    monthlyPackageId: packageId,
    ...data,
    uploadedAt: new Date(),
  };
  store.statements.push(stmt);
  return stmt;
}

export function findStatement(id: string, packageId: string) {
  return (
    store.statements.find(
      (s) => s.id === id && s.monthlyPackageId === packageId
    ) ?? null
  );
}

export function removeStatement(id: string) {
  const idx = store.statements.findIndex((s) => s.id === id);
  if (idx !== -1) store.statements.splice(idx, 1);
}

// ── Institutions ──

export function getInstitutionsForUser(userId: string) {
  const pkgIds = new Set(
    store.packages.filter((p) => p.userId === userId).map((p) => p.id)
  );
  const names = new Set(
    store.statements
      .filter((s) => pkgIds.has(s.monthlyPackageId))
      .map((s) => s.institutionName)
  );
  return Array.from(names).sort();
}

// ── Seed data ──

function seedHistory(userId: string) {
  const now = new Date();

  const seeds = [
    {
      monthsAgo: 3,
      status: "finished",
      stmts: [
        { inst: "Chase Bank", last4: "4821", type: "bank", file: "chase-oct-2025.pdf" },
        { inst: "Amex", last4: "1003", type: "credit_card", file: "amex-oct-2025.pdf" },
      ],
    },
    {
      monthsAgo: 2,
      status: "reconciled",
      stmts: [
        { inst: "Chase Bank", last4: "4821", type: "bank", file: "chase-nov-2025.pdf" },
        { inst: "Amex", last4: "1003", type: "credit_card", file: "amex-nov-2025.pdf" },
        { inst: "SBA Loan", last4: "7890", type: "loan", file: "sba-nov-2025.pdf" },
      ],
    },
    {
      monthsAgo: 1,
      status: "categorizing",
      stmts: [
        { inst: "Chase Bank", last4: "4821", type: "bank", file: "chase-dec-2025.pdf" },
        {
          inst: "Capital One",
          last4: "5567",
          type: "credit_card",
          file: "capone-dec-2025.pdf",
        },
      ],
    },
  ];

  for (const seed of seeds) {
    const d = new Date(now.getFullYear(), now.getMonth() - seed.monthsAgo, 1);
    const pkgId = crypto.randomUUID();
    store.packages.push({
      id: pkgId,
      userId,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      status: seed.status,
      submittedAt:
        seed.status !== "need_statements"
          ? new Date(d.getTime() + 86400000 * 15)
          : null,
      createdAt: d,
    });
    for (const s of seed.stmts) {
      store.statements.push({
        id: crypto.randomUUID(),
        monthlyPackageId: pkgId,
        institutionName: s.inst,
        accountLast4: s.last4,
        institutionType: s.type,
        fileUrl: "#mock",
        fileName: s.file,
        fileSize: Math.floor(Math.random() * 2_000_000) + 100_000,
        uploadedAt: new Date(d.getTime() + 86400000 * 10),
      });
    }
  }
}
