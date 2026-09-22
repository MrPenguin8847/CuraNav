"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { StatStrip } from "@/components/StatStrip";
import { BrowseByCondition } from "@/components/BrowseByCondition";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { Testimonials } from "@/components/Testimonials";
import { AppDownloadCTA } from "@/components/AppDownloadCTA";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Header />

      <main className="flex-grow">
        <HeroSearch query={query} setQuery={setQuery} />
        <StatStrip />
        <BrowseByCondition onSelect={setQuery} />
        <HowItWorks />
        <WhyChooseUs />
        <Testimonials />
        <AppDownloadCTA />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
