import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/",
    verifyRequest: "/?verify=true",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname === "/";
      const isOnVerifyPage = nextUrl.searchParams.get("verify") === "true";
      const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isStaticRoute =
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/favicon") ||
        nextUrl.pathname === "/robots.txt";

      if (isStaticRoute || isAuthRoute) return true;

      if (isOnLoginPage || isOnVerifyPage) {
        if (isLoggedIn) {
          // Middleware doesn't have custom session fields, so redirect to
          // /dashboard and let the layout handle bookkeeper re-routing
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
