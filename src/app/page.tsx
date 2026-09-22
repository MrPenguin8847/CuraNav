"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { BrowseByCondition } from "@/components/BrowseByCondition";
import { StatStrip } from "@/components/StatStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustBanner } from "@/components/TrustBanner";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-grow">
        {/* Hero + Search — query state is shared so condition cards can pre-fill it */}
        <HeroSearch query={query} setQuery={setQuery} />

        {/* Section separator */}
        <div className="bg-background">
          {/* Browse by condition — clickable cards pre-fill the search box */}
          <BrowseByCondition onSelect={setQuery} />

          {/* Trust / stats strip */}
          <StatStrip />

          {/* How CuraNav works — 3-step explainer */}
          <HowItWorks />

          {/* Responsible AI trust callout */}
          <TrustBanner />
        </div>
      </main>

      <Footer />
    </div>
  );
}
