"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setSubscribing(true);
    // Simulate subscription - can be connected to an API later
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("Thank you for subscribing to our newsletter!");
    setEmail("");
    setSubscribing(false);
  };

  return (
    <footer style={{ backgroundColor: "#2E8B57" }} className="text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="State-ImmoCom"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold">State-ImmoCom</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Ghana&apos;s premier real estate platform for buying, renting, and
              investing in properties across Accra. We connect property seekers
              with trusted agents and verified listings.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Quick Links</h3>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/properties"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Properties
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Agent Login
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Admin Login
              </Link>
            </nav>
          </div>

          {/* Contact Info Column */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Contact Info</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-white/70" />
                <span className="text-sm text-white/80">
                  25 Oxford Street, Osu
                  <br />
                  Accra, Greater Accra
                  <br />
                  Ghana
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-white/70" />
                <a
                  href="tel:+233201234567"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  +233 20 123 4567
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-white/70" />
                <a
                  href="mailto:info@state-immocom.com"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  info@state-immocom.com
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Newsletter</h3>
            <p className="text-sm text-white/80">
              Subscribe to get the latest property listings and market updates
              delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={subscribing}
                style={{ backgroundColor: "#F4C430" }}
                className="shrink-0 text-gray-900 hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="border-t border-white/10"
        style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-white/60">
            &copy; 2024 State-ImmoCom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
