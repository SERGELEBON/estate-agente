import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * /dashboard — Root dashboard page that redirects to the correct
 * role-based sub-dashboard (admin or agent).
 * Uses SERVER-SIDE session check with getServerSession to avoid
 * client-side redirect loops.
 */
export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = (session.user as any).role;

  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/agent");
  }
}
