import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CuraNav — AI-Powered PM-JAY Hospital Discovery",
  description:
    "Search, compare, and navigate PM-JAY empanelled hospitals across India. Compare costs, outcomes, and certifications — powered by transparent AI. Built for TECHNOVA 2026.",
  other: {
    "strix-verification": "strix-verify-afaeb989aaebc20fc65b2b738a804bd8",
  },
};

import { Chatbot } from "@/components/Chatbot";
import { EmergencyGate } from "@/components/EmergencyGate";
import { StarBackground } from "@/components/ui/star-background";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-transparent text-foreground relative">
        <StarBackground />
        {children}
        <Chatbot />
        <EmergencyGate />
      </body>
    </html>
  );
}
