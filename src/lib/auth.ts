import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { authConfig } from "./auth.config";
import * as mock from "./mock-store";

const isMock = process.env.USE_MOCK === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: isMock
    ? undefined
    : DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
  session: { strategy: "jwt" },
  providers: isMock
    ? [
        Credentials({
          credentials: { email: { label: "Email", type: "email" } },
          async authorize(credentials) {
            const email = credentials?.email as string;
            if (!email) return null;
            let user = mock.findUserByEmail(email);
            if (!user) user = mock.createUser(email);
            return { id: user.id, email: user.email, name: user.name };
          },
        }),
      ]
    : [
        Resend({
          apiKey: process.env.RESEND_API_KEY,
          from: "MyBookkeepers.com <noreply@mybookkeepers.com>",
        }),
      ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;

        if (isMock) {
          let u = mock.findUserById(token.id as string);
          if (!u && token.email) {
            // Re-create mock user after server restart, preserving JWT id
            u = mock.createUser(token.email as string, token.id as string);
          }
          session.user.onboardingComplete = !!(u?.name && u?.companyName);
        } else {
          const { eq } = await import("drizzle-orm");
          const { users } = await import("@/lib/db/schema");
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, token.id as string),
          });
          session.user.onboardingComplete = !!(
            dbUser?.name && dbUser?.companyName
          );
        }
      }
      return session;
    },
  },
});
