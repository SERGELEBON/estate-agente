import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/** /dashboard — sends each role to its own space. */
export default async function DashboardRedirectPage() {
  const me = await getSessionUser();
  if (!me) redirect("/auth/signin");
  if (me.role === "ADMIN") redirect("/dashboard/admin");
  if (me.role === "CLIENT") redirect("/account/messages");
  if (me.agentStatus === "INCOMPLETE") redirect("/onboarding/agent");
  redirect("/dashboard/agent");
}
