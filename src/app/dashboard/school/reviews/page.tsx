"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/schools/star-rating";

interface Review {
  id: string; rating: number; title: string | null; comment: string; hidden: boolean;
  reply: string | null; createdAt: string; author: { name: string | null };
}

export default function SchoolReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schools/me/reviews").then((r) => r.json()).then((d) => setReviews(d.reviews ?? []));
  }, []);

  const reply = async (id: string) => {
    setSaving(id);
    const res = await fetch(`/api/schools/me/reviews/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: drafts[id] ?? "" }),
    });
    setSaving(null);
    if (!res.ok) return toast.error("Reply not saved");
    const { review } = await res.json();
    setReviews((rs) => rs?.map((r) => (r.id === id ? { ...r, reply: review.reply } : r)) ?? null);
    toast.success("Reply published");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">Answer students publicly — a polite reply builds trust, even on a critical review.</p>
      </div>
      {reviews === null ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No reviews yet. Ask your students to rate you from your public page.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating value={r.rating} size={14} />
                <span className="text-sm font-medium">{r.author.name ?? "Student"}</span>
                {r.hidden && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Hidden by moderation</span>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.title && <p className="font-medium">{r.title}</p>}
            <p className="whitespace-pre-line text-sm text-muted-foreground">{r.comment}</p>
            <Textarea
              rows={2}
              maxLength={1000}
              placeholder="Write a public reply…"
              value={drafts[r.id] ?? r.reply ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
            />
            <Button size="sm" disabled={saving === r.id} onClick={() => reply(r.id)} className="text-white" style={{ backgroundColor: "#2E8B57" }}>
              {saving === r.id && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} {r.reply ? "Update reply" : "Reply"}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
