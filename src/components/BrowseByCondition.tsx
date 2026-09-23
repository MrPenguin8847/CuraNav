"use client";

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
}

const services = [
  {
    icon: Heart,
    label: "Cardiology",
    description: "Heart surgery, bypass, and cardiac care — 19 hospitals",
    query: "Best hospital for heart surgery under PM-JAY",
    color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
  },
  {
    icon: Siren,
    label: "Emergency Care",
    description: "24/7 emergency & trauma packages — 25 hospitals",
    query: "Hospitals with emergency room and trauma care",
    color: "text-red-600 bg-red-50 group-hover:bg-red-100",
  },
  {
    icon: Bone,
    label: "Orthopaedics",
    description: "Joint replacement, fractures & spine care — 11 hospitals",
    query: "Orthopaedic hospitals for joint replacement surgery",
    color: "text-amber-600 bg-amber-50 group-hover:bg-amber-100",
  },
  {
    icon: Baby,
    label: "Maternity & Gynae",
    description: "Pregnancy, delivery & women's health — 18 hospitals",
    query: "Maternity hospital for pregnancy and delivery care",
    color: "text-pink-600 bg-pink-50 group-hover:bg-pink-100",
  },
  {
    icon: Droplet,
    label: "Kidney & Dialysis",
    description: "Renal care & dialysis under General Medicine — 56 hospitals",
    query: "Kidney treatment hospital with dialysis facility",
    color: "text-sky-600 bg-sky-50 group-hover:bg-sky-100",
  },
  {
    icon: Plus,
    label: "General Surgery",
    description: "Surgical procedures & oncology — 29 hospitals",
    query: "General surgery hospital for cancer treatment",
    color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100",
  },
  {
    icon: Eye,
    label: "Ophthalmology",
    description: "Cataract surgery & eye care — 3 hospitals",
    query: "Eye hospital for cataract and vision care",
    color: "text-teal-600 bg-teal-50 group-hover:bg-teal-100",
  },
  {
    icon: Brain,
    label: "Burns & Plastic Surgery",
    description: "Burns management & reconstructive care — 20 hospitals",
    query: "Hospital for burn treatment and care",
    color: "text-violet-600 bg-violet-50 group-hover:bg-violet-100",
  },
];

export function BrowseByCondition({ onSelect }: BrowseByConditionProps) {
  return (
    <section id="services" className="section-padding section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            Browse Specialties
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Search by <span className="gradient-text">Medical Need</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Select a specialty to instantly search PM-JAY empanelled hospitals, compare
            treatment costs, and view verified facility data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(({ icon: Icon, label, description, query, color }) => (
            <button
              key={label}
              onClick={() => {
                onSelect(query);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group text-left p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${color}`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                {label}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                {description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
