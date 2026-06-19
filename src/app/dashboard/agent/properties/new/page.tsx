"use client";

import { useAuth } from "@/lib/auth-context";
import PropertyForm from "@/components/property-form";

export default function AgentAddPropertyPage() {
  const { userId } = useAuth();

  if (!userId) return null;

  return (
    <PropertyForm
      mode="agent"
      agentId={userId}
      redirectPath="/dashboard/agent/properties"
    />
  );
}
