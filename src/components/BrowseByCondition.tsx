"use client";

import {
  Droplet,
  Heart,
  Plus,
  Bone,
  Baby,
  Siren,
} from "lucide-react";

interface BrowseByConditionProps {
  onSelect: (query: string) => void;
}

const conditions = [
  {
    icon: Droplet,
    label: "Kidney Disease",
    query: "Kidney treatment hospitals near me with dialysis",
  },
  {
    icon: Heart,
    label: "Heart Disease",
    query: "Heart hospitals with cardiology and bypass surgery",
  },
  {
    icon: Plus,
    label: "Cancer Care",
    query: "Cancer hospitals with chemotherapy and oncology unit",
  },
  {
    icon: Bone,
    label: "Orthopaedic",
    query: "Orthopaedic hospitals with joint replacement surgery",
  },
  {
    icon: Baby,
    label: "Maternity",
    query: "Maternity hospitals with NICU and delivery care",
  },
  {
    icon: Siren,
    label: "Emergency Care",
    query: "Hospitals with 24/7 emergency and trauma care",
  },
];

export function BrowseByCondition({ onSelect }: BrowseByConditionProps) {
  return (
    <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-2xl font-bold text-foreground text-center mb-2">
        Or browse by condition
      </h2>
      <p className="text-slate-500 text-center text-sm mb-10">
        Select a condition to instantly find relevant hospitals and filters.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {conditions.map(({ icon: Icon, label, query }) => (
          <button
            key={label}
            onClick={() => {
              onSelect(query);
              console.log("Condition selected:", label, "→", query);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group flex flex-col items-center gap-3 p-5 bg-white border border-border rounded-2xl shadow-sm hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground text-center leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
