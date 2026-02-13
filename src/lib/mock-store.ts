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
  role: "client" | "bookkeeper";
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
  bookkeeperDataSeeded: boolean;
}

const g = globalThis as unknown as { __mockStore?: Store };
if (!g.__mockStore) {
  g.__mockStore = { users: [], packages: [], statements: [], bookkeeperDataSeeded: false };
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
  const role = email.endsWith("@mybookkeepers.com") ? "bookkeeper" as const : "client" as const;
  const user: MockUser = {
    id: id ?? crypto.randomUUID(),
    name: null,
    email,
    emailVerified: new Date(),
    image: null,
    companyName: null,
    qboName: null,
    phone: null,
    role,
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

/** Bookkeeper version: get package by ID without ownership check */
export function getPackageByIdUnscoped(id: string) {
  const pkg = store.packages.find((p) => p.id === id);
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

export function updatePackageStatus(id: string, status: string) {
  const pkg = store.packages.find((p) => p.id === id);
  if (!pkg) return null;
  pkg.status = status;
  return pkg;
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

// ── Bookkeeper operations ──

export function getAllClients() {
  const clients = store.users.filter((u) => u.role === "client");
  return clients.map((u) => {
    const userPkgs = store.packages
      .filter((p) => p.userId === u.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const stmtCount = userPkgs.reduce((sum, p) => {
      return sum + store.statements.filter((s) => s.monthlyPackageId === p.id).length;
    }, 0);

    const latestPkg = userPkgs[0] ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      companyName: u.companyName,
      latestActivity: latestPkg ? latestPkg.createdAt.toISOString() : null,
      latestPackageStatus: latestPkg ? latestPkg.status : null,
      statementCount: stmtCount,
    };
  });
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

/** Seed mock client data for bookkeeper view. Only runs once. */
export function seedBookkeeperData() {
  if (store.bookkeeperDataSeeded) return;
  store.bookkeeperDataSeeded = true;

  const now = new Date();
  const mockClients = [
    {
      name: "Sarah Johnson",
      email: "sarah@johnsonconsulting.com",
      company: "Johnson Consulting LLC",
      months: [
        {
          monthsAgo: 1,
          status: "categorizing",
          stmts: [
            { inst: "Chase Bank", last4: "9012", type: "bank", file: "chase-jan-2026.pdf" },
            { inst: "Amex Business", last4: "3456", type: "credit_card", file: "amex-jan-2026.pdf" },
          ],
        },
        {
          monthsAgo: 2,
          status: "finished",
          stmts: [
            { inst: "Chase Bank", last4: "9012", type: "bank", file: "chase-dec-2025.pdf" },
            { inst: "Amex Business", last4: "3456", type: "credit_card", file: "amex-dec-2025.pdf" },
          ],
        },
      ],
    },
    {
      name: "Mike Chen",
      email: "mike@chensrestaurant.com",
      company: "Chen's Restaurant Group",
      months: [
        {
          monthsAgo: 1,
          status: "need_statements",
          stmts: [],
        },
        {
          monthsAgo: 2,
          status: "reconciled",
          stmts: [
            { inst: "Bank of America", last4: "7788", type: "bank", file: "boa-dec-2025.pdf" },
            { inst: "US Bank Loan", last4: "2200", type: "loan", file: "usbank-dec-2025.pdf" },
          ],
        },
        {
          monthsAgo: 3,
          status: "finished",
          stmts: [
            { inst: "Bank of America", last4: "7788", type: "bank", file: "boa-nov-2025.pdf" },
          ],
        },
      ],
    },
    {
      name: "Lisa Park",
      email: "lisa@parkdesignstudio.com",
      company: "Park Design Studio",
      months: [
        {
          monthsAgo: 1,
          status: "categorizing",
          stmts: [
            { inst: "Wells Fargo", last4: "4455", type: "bank", file: "wellsfargo-jan-2026.pdf" },
            { inst: "Capital One", last4: "6677", type: "credit_card", file: "capone-jan-2026.pdf" },
            { inst: "PayPal", last4: "8899", type: "other", file: "paypal-jan-2026.pdf" },
          ],
        },
      ],
    },
    {
      name: "David Kim",
      email: "david@kimplumbing.com",
      company: "Kim Plumbing & HVAC",
      months: [
        {
          monthsAgo: 1,
          status: "reconciling",
          stmts: [
            { inst: "US Bank", last4: "1122", type: "bank", file: "usbank-jan-2026.pdf" },
            { inst: "Home Depot Card", last4: "3344", type: "credit_card", file: "homedepot-jan-2026.pdf" },
          ],
        },
        {
          monthsAgo: 2,
          status: "finished",
          stmts: [
            { inst: "US Bank", last4: "1122", type: "bank", file: "usbank-dec-2025.pdf" },
            { inst: "Home Depot Card", last4: "3344", type: "credit_card", file: "homedepot-dec-2025.pdf" },
          ],
        },
      ],
    },
  ];

  for (const client of mockClients) {
    // Don't re-create if user already exists
    if (findUserByEmail(client.email)) continue;

    const user = createUser(client.email);
    user.name = client.name;
    user.companyName = client.company;
    user.role = "client";

    for (const m of client.months) {
      const d = new Date(now.getFullYear(), now.getMonth() - m.monthsAgo, 1);
      const pkgId = crypto.randomUUID();
      store.packages.push({
        id: pkgId,
        userId: user.id,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        status: m.status,
        submittedAt: m.status !== "need_statements" ? new Date(d.getTime() + 86400000 * 15) : null,
        createdAt: d,
      });
      for (const s of m.stmts) {
        store.statements.push({
          id: crypto.randomUUID(),
          monthlyPackageId: pkgId,
          institutionName: s.inst,
          accountLast4: s.last4,
          institutionType: s.type,
          fileUrl: `#mock-file-${s.file}`,
          fileName: s.file,
          fileSize: Math.floor(Math.random() * 2_000_000) + 100_000,
          uploadedAt: new Date(d.getTime() + 86400000 * 10),
        });
      }
    }
  }
}
