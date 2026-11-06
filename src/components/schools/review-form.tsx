"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AuthPanel } from "@/components/auth/auth-panel";
import { cn } from "@/lib/utils";

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Students rate a school: sign-in required (one review per person, editable). */
export function ReviewForm({ slug, schoolName, ownerId }: { slug: string; schoolName: string; ownerId: string }) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const me = session?.user as any;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (status === "loading") return null;

  if (!me) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <AuthPanel
          compact
          intent="client"
          callbackUrl={`/schools/${slug}#review`}
          title={`Studied at ${schoolName}?`}
          subtitle="Sign in to leave a review. Only verified students can rate schools."
          onSignedIn={async () => {
            await update();
            router.refresh();
          }}
        />
      </div>
    );
  }

  if (me.id === ownerId || me.role !== "CLIENT") {
    return (
      <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        Reviews can only be written from a student (client) account.
      </p>
    );
  }

  if (done) {
    return <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Thanks — your review is published.</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Choose a rating from 1 to 5 stars.");
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/schools/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Your review could not be saved.");
    setDone(true);
    router.refresh();
  };

  const shown = hover || rating;
  return (
    <form id="review" onSubmit={submit} className="space-y-3 rounded-2xl border bg-card p-5">
      <h3 className="font-semibold">Rate {schoolName}</h3>
      <div className="flex items-center gap-3">
        <div className="flex" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star className={cn("h-7 w-7 transition-colors", n <= shown ? "text-[#F4C430]" : "text-gray-300")} fill={n <= shown ? "#F4C430" : "none"} />
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{WORDS[shown]}</span>
      </div>
      <Input placeholder="Title (optional) — e.g. Great IELTS preparation" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        rows={4}
        maxLength={2000}
        placeholder="What did you study, how were the teachers, would you recommend it?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy} className="text-white" style={{ backgroundColor: "#2E8B57" }}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish my review
      </Button>
      <p className="text-[11px] text-muted-foreground">Reviews must reflect a real experience. Abusive or fake reviews are removed.</p>
    </form>
  );
}
