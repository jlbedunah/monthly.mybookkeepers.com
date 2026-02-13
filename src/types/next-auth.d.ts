import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      onboardingComplete: boolean;
      role: "client" | "bookkeeper";
    };
  }

  interface User {
    companyName?: string | null;
    qboName?: string | null;
    phone?: string | null;
  }
}
