"use client";

import { useState, useEffect } from "react";
import PropertyForm from "@/components/property-form";

interface Agent {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export default function AdminAddPropertyPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/users?role=AGENT&limit=100");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.users || []);
        }
      } catch {
        // silently handle
      }
    }
    fetchAgents();
  }, []);

  return (
    <PropertyForm
      mode="admin"
      agents={agents}
      redirectPath="/dashboard/admin/properties"
    />
  );
}
