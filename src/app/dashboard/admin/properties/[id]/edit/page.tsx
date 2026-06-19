"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PropertyForm from "@/components/property-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditAdminPropertyPage() {
  const params = useParams();
  const id = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/properties/${id}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch property");
        return r.json();
      }),
      fetch(`/api/users?role=AGENT&limit=100`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch agents");
        return r.json();
      }),
    ])
      .then(([propData, usersData]) => {
        setProperty(propData);
        setAgents(usersData.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!property) return <p>Property not found.</p>;

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Update failed");
    }
  };

  return (
    <PropertyForm
      mode="admin"
      agents={agents}
      redirectPath="/dashboard/admin/properties"
      property={property}
      onSubmit={handleSubmit}
    />
  );
}
