"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PropertyForm from "@/components/property-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditAgentPropertyPage() {
  const { userId } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/properties/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProperty(data);
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
      mode="agent"
      agentId={userId || undefined}
      redirectPath="/dashboard/agent/properties"
      property={property}
      onSubmit={handleSubmit}
    />
  );
}
