"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    subject: "",
    body: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await res.json();
      toast.success("Message sent! We'll reply in your inbox here.", { duration: 6000 });
      setForm({ senderName: "", senderEmail: "", senderPhone: "", subject: "", body: "" });

      // Offer the visitor a link to view the conversation (magic token)
      if (data.visitorToken) {
        const link = `/messages/${data.visitorToken}`;
        setTimeout(() => {
          toast(
            <div className="space-y-1">
              <p className="font-medium">Track this conversation</p>
              <a href={link} className="text-sm underline" style={{ color: "#2E8B57" }}>
                Open your inbox →
              </a>
            </div>,
            { duration: 12000 }
          );
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground md:text-4xl">
              Contact Us
            </h1>
            <p className="mt-3 text-primary-foreground/80 max-w-2xl mx-auto">
              Have questions about buying, renting, or investing in Accra real estate?
              Our team of experts is here to help you every step of the way.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Our Office</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        24 Oxford Street, Osu<br />
                        Accra, Greater Accra Region<br />
                        Ghana
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        +233 20 000 0001<br />
                        +233 30 000 0002
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        info@state-immocom.com<br />
                        support@state-immocom.com
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Business Hours</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monday – Friday: 8:00 AM – 6:00 PM<br />
                        Saturday: 9:00 AM – 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input id="name" required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="John Mensah" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input id="email" type="email" required value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} placeholder="john@example.com" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} placeholder="+233 20 000 0000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Property inquiry" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea id="message" required rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Tell us how we can help you..." />
                      </div>
                      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                        {loading ? "Sending..." : <><Send className="mr-2 h-4 w-4" />Send Message</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
