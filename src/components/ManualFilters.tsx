"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";

export function ManualFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || searchParams.get("specialty") || "");
  const [budget, setBudget] = useState(searchParams.get("max_budget") || "");
  
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    // Clear natural language query to force manual mode
    if (city) params.set("city", city);
    if (condition) params.set("condition", condition);
    if (budget) params.set("max_budget", budget);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setCity("");
    setCondition("");
    setBudget("");
    router.push(pathname);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Filter className="w-5 h-5 text-primary" />
          Manual Filter
        </div>
        <span className="text-sm font-medium text-muted">
          {isOpen ? "Hide" : "Show"} options
        </span>
      </button>

      {isOpen && (
        <form onSubmit={handleApply} className="p-4 border-t border-border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Chandigarh"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Condition/Specialty</label>
            <input 
              type="text" 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. Kidney, Heart"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Budget (₹)</label>
            <input 
              type="number" 
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
            <button 
              type="submit"
              className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              Apply
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
