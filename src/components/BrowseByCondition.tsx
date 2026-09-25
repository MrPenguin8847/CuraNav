"use client";

import type { CSSProperties } from "react";
import {
  Heart,
  Brain,
  Bone,
  Baby,
  Siren,
  Eye,
  Droplet,
  Plus,
  ArrowRight,
} from "lucide-react";

interface BrowseByConditionProps {
  onSelect: (query: string) => void;
  mode?: "full" | "handoff" | "remaining";
  handoffProgress?: number;
}

const services = [
  {
    icon: Heart,
    label: "Cardiology",
    description: "Heart surgery, bypass, and cardiac care — 19 hospitals",
    query: "Best hospital for heart surgery under PM-JAY",
    color: "text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20",
  },
  {
    icon: Siren,
    label: "Emergency Care",
    description: "24/7 emergency & trauma packages — 25 hospitals",
    query: "Hospitals with emergency room and trauma care",
    color: "text-red-400 bg-red-500/10 group-hover:bg-red-500/20",
  },
  {
    icon: Bone,
    label: "Orthopaedics",
    description: "Joint replacement, fractures & spine care — 11 hospitals",
    query: "Orthopaedic hospitals for joint replacement surgery",
    color: "text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    icon: Baby,
    label: "Maternity & Gynae",
    description: "Pregnancy, delivery & women's health — 18 hospitals",
    query: "Maternity hospital for pregnancy and delivery care",
    color: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20",
  },
  {
    icon: Droplet,
    label: "Kidney & Dialysis",
    description: "Renal care & dialysis under General Medicine — 56 hospitals",
    query: "Kidney treatment hospital with dialysis facility",
    color: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20",
  },
  {
    icon: Plus,
    label: "General Surgery",
    description: "Surgical procedures & oncology — 29 hospitals",
    query: "General surgery hospital for cancer treatment",
    color: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
  },
  {
    icon: Eye,
    label: "Ophthalmology",
    description: "Cataract surgery & eye care — 3 hospitals",
    query: "Eye hospital for cataract and vision care",
    color: "text-teal-400 bg-teal-500/10 group-hover:bg-teal-500/20",
  },
  {
    icon: Brain,
    label: "Burns & Plastic Surgery",
    description: "Burns management & reconstructive care — 20 hospitals",
    query: "Hospital for burn treatment and care",
    color: "text-violet-400 bg-violet-500/10 group-hover:bg-violet-500/20",
  },
];

const FIRST_ROW_LENGTH = 4;

type Service = (typeof services)[number];

function SpecialtyHeading({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
        Browse Specialties
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Search by <span className="gradient-text text-gradient-brand">Medical Need</span>
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Select a specialty to instantly search PM-JAY empanelled hospitals, compare
        treatment costs, and view verified facility data.
      </p>
    </div>
  );
}

function ServiceCard({
  service,
  onSelect,
}: {
  service: Service;
  onSelect: (query: string) => void;
}) {
  const { icon: Icon, label, description, query, color } = service;

  return (
    <button
      onClick={() => {
        onSelect(query);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group text-left p-6 glass rounded-2xl hover-lift cursor-pointer hover:border-primary/20"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${color}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
        {label}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Learn more <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

function ServiceGrid({
  visibleServices,
  onSelect,
}: {
  visibleServices: Service[];
  onSelect: (query: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {visibleServices.map((service) => (
        <ServiceCard
          key={service.label}
          service={service}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function BrowseByCondition({
  onSelect,
  mode = "full",
  handoffProgress = 0,
}: BrowseByConditionProps) {
  const visibleServices: Service[] =
    mode === "handoff"
      ? services.slice(0, FIRST_ROW_LENGTH)
      : mode === "remaining"
        ? services.slice(FIRST_ROW_LENGTH)
        : services;
  const legibilityProgress = Math.min(1, Math.max(0, handoffProgress) / 0.18);
  const panelTopAlpha = 0.78 + legibilityProgress * 0.22;
  const panelBottomAlpha = Math.min(1, panelTopAlpha + 0.12);
  const panelStyle: CSSProperties = {
    background: `transparent`,
    // Removing heavy blur so stars remain crisp
  };

  if (mode === "handoff") {
    return (
      <section id="services" className="relative z-10 w-full">
        <div
          className="border-y border-white/10 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.9)]"
          style={panelStyle}
        >
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <SpecialtyHeading className="mb-10" />
            <ServiceGrid visibleServices={visibleServices} onSelect={onSelect} />
          </div>
        </div>
      </section>
    );
  }

  if (mode === "remaining") {
    return (
      <section className="relative z-20 bg-background section-padding py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceGrid visibleServices={visibleServices} onSelect={onSelect} />
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="section-padding py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SpecialtyHeading className="mb-14" />
        <ServiceGrid visibleServices={visibleServices} onSelect={onSelect} />
      </div>
    </section>
  );
}
