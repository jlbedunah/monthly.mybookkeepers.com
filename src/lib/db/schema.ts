import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// Enums
export const userRoleEnum = pgEnum("user_role", ["client", "bookkeeper"]);

export const packageStatusEnum = pgEnum("package_status", [
  "need_statements",
  "categorizing",
  "categorized",
  "reconciling",
  "reconciled",
  "finished",
]);

export const institutionTypeEnum = pgEnum("institution_type", [
  "bank",
  "credit_card",
  "loan",
  "other",
]);

// NextAuth required tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  companyName: text("company_name"),
  qboName: text("qbo_name"),
  phone: text("phone"),
  role: userRoleEnum("role").default("client").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// Application tables
export const monthlyPackages = pgTable(
  "monthly_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    status: packageStatusEnum("status").default("need_statements").notNull(),
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_month_year_idx").on(table.userId, table.month, table.year),
  ]
);

export const statements = pgTable("statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  monthlyPackageId: uuid("monthly_package_id")
    .notNull()
    .references(() => monthlyPackages.id, { onDelete: "cascade" }),
  institutionName: text("institution_name").notNull(),
  accountLast4: varchar("account_last4", { length: 4 }).notNull(),
  institutionType: institutionTypeEnum("institution_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  monthlyPackages: many(monthlyPackages),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const monthlyPackagesRelations = relations(
  monthlyPackages,
  ({ one, many }) => ({
    user: one(users, {
      fields: [monthlyPackages.userId],
      references: [users.id],
    }),
    statements: many(statements),
  })
);

export const statementsRelations = relations(statements, ({ one }) => ({
  monthlyPackage: one(monthlyPackages, {
    fields: [statements.monthlyPackageId],
    references: [monthlyPackages.id],
  }),
}));
