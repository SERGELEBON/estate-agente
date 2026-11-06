import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ChatBot } from "@/components/chatbot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Editorial serif for headlines (hero, section titles) — Inter stays the UI/body font.
const display = Playfair_Display({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "State-ImmoCom - Find Your Perfect Property in Accra",
  description:
    "Ghana's premier real estate platform for buying, renting, and investing in properties across Accra. Buy • Rent • Invest",
  keywords: [
    "real estate",
    "Accra",
    "Ghana",
    "property",
    "buy",
    "rent",
    "invest",
    "State-ImmoCom",
  ],
  authors: [{ name: "State-ImmoCom" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "State-ImmoCom - Find Your Perfect Property in Accra",
    description:
      "Ghana's premier real estate platform for buying, renting, and investing in properties across Accra.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AuthProvider>
          {children}
          <Toaster />
          <ChatBot />
        </AuthProvider>
      </body>
    </html>
  );
}
