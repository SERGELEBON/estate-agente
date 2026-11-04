import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { title: "Data Deletion | State-ImmoCom" };

export default function DataDeletionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold">Delete your data</h1>
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          <p>You can ask us to delete your State-ImmoCom account and all associated data (profile, conversations, visit requests) at any time, including if you signed in with Facebook or Google.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Send a request from the <a className="underline" href="/contact">contact page</a> with the subject <strong>“Delete my data”</strong>, using the email address of your account.</li>
            <li>We confirm the request by email and delete your data within 30 days.</li>
            <li>To also remove State-ImmoCom from your Facebook account: Facebook → Settings &amp; privacy → Settings → Apps and websites → State-ImmoCom → Remove.</li>
          </ol>
          <p>Some records may be kept longer only where the law requires it.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
