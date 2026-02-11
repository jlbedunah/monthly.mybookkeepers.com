import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // If already onboarded, go to dashboard
  if (session.user.onboardingComplete) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
