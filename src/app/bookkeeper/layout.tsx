import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function BookkeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "bookkeeper") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
