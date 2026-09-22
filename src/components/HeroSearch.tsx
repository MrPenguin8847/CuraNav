"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AdvancedFilters } from "./AdvancedFilters";

interface HeroSearchProps {
  query: string;
  setQuery: (q: string) => void;
}

export function HeroSearch({ query, setQuery }: HeroSearchProps) {
  const exampleQueries = [
    "Find heart hospitals near Delhi",
    "Kidney treatment under ₹2 lakh",
    "Cancer hospitals with chemotherapy",
  ];

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    // The raw NL search
    if (query) {
      params.append("q", query);
    }

    // Advanced filters
    const city = formData.get("city") as string;
    if (city) params.append("city", city);

    const specialty = formData.get("specialty") as string;
    if (specialty) params.append("specialty", specialty);

    const condition = formData.get("condition") as string;
    if (condition) params.append("condition", condition);

    const maxBudget = formData.get("max_budget") as string;
    if (maxBudget) params.append("max_budget", maxBudget);

    if (formData.get("verified_only")) {
      params.append("verified_only", "true");
    }

    const facilities = formData.getAll("facilities") as string[];
    if (facilities.length > 0) {
      params.append("facilities", facilities.join(","));
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative pt-24 pb-20 overflow-hidden">
      {/* Background decoration to match the purple theme */}
      <div className="absolute inset-0 bg-primary-light/50 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Discover{" "}
          <span className="text-primary">Healthcare</span> that Fits You
        </h2>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Find, compare, and navigate trusted hospitals and treatments based on
          your specific needs, budget, and location.
        </p>

        <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-4 md:p-6 border border-border">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <Search className="absolute left-6 w-6 h-6 text-slate-400" />
              <input
                type="text"
                name="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe what you need — e.g. 'kidney treatment near Chandigarh under ₹2 lakh with dialysis'"
                className="w-full pl-16 pr-32 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary/30 rounded-2xl text-lg md:text-xl outline-none transition-all placeholder:text-slate-400 shadow-inner shadow-slate-100"
                required
              />
              <button
                type="submit"
                className="absolute right-3 btn-primary py-3 md:py-4 px-8 text-base shadow-md shadow-primary/20"
              >
                Search
              </button>
            </div>

            <AdvancedFilters />
          </form>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-slate-500 mb-3">
            Or try an example search:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(example)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors shadow-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
