import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.onboardingComplete) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
