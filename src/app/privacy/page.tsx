import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { title: "Privacy Policy | State-ImmoCom" };

const UPDATED = "4 November 2026";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {UPDATED}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Who we are</h2>
            <p>State-ImmoCom is a real estate platform in Accra, Ghana, that connects people looking to buy, rent or invest with verified real estate agents.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Data we collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Account data: name, email address and profile picture, provided by you or by Google / Facebook when you choose to sign in with them.</li>
              <li>Agents: phone, WhatsApp, agency, licence number, areas served and biography.</li>
              <li>Messages you exchange with agents, and visit requests.</li>
              <li>Technical data: a hashed (non-reversible) IP address used only to prevent spam.</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">How we use it</h2>
            <p>To create and secure your account, deliver your messages to the agent you chose, send you sign-in codes and reply notifications by email, and verify agents. We do not sell your data and we do not use it for advertising.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Google and Facebook sign-in</h2>
            <p>When you sign in with Google or Facebook we only receive your name, email address and profile picture. We never receive your password and we never post on your behalf.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Sharing</h2>
            <p>Your name and messages are shared only with the agent you contact. Data is hosted by our processors (Vercel, Neon, Cloudinary and our email provider) under their security commitments.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Your rights</h2>
            <p>You can request access, correction or deletion of your data at any time — see <a className="underline" href="/data-deletion">Data deletion</a> or write to us via the <a className="underline" href="/contact">contact page</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
