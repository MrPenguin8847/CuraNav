"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";

export function AdvancedFilters() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Facilities options
  const facilities = [
    "ICU", "Dialysis", "NICU", "MRI", "CT Scan", 
    "Blood Bank", "Cath Lab", "Emergency", "Oncology Unit", "Robotic Surgery"
  ];

  return (
    <div className="w-full mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mx-auto flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <span>{isOpen ? "Hide Advanced Filters" : "Show Advanced Filters"}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="mt-4 p-6 glass bg-background/50 rounded-2xl shadow-sm border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Specialty / Condition */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Specialty / Condition</label>
              <select 
                name="specialty" 
                className="w-full px-4 py-2 bg-background/80 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="">Any Specialty</option>
                <option value="cardiology">Cardiology</option>
                <option value="oncology">Oncology</option>
                <option value="nephrology">Nephrology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  name="location" 
                  placeholder="Enter city or pin code" 
                  className="w-full pl-9 pr-24 py-2 bg-background/80 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                />
                <button 
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/10 hover:bg-white/20 text-xs font-medium text-foreground rounded transition-colors"
                >
                  Use my location
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Budget Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    name="minBudget" 
                    placeholder="Min" 
                    className="w-full pl-7 pr-3 py-2 bg-background/80 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    name="maxBudget" 
                    placeholder="Max" 
                    className="w-full pl-7 pr-3 py-2 bg-background/80 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>
            
            {/* Sort Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">Sort Priority</label>
              <select 
                name="sort" 
                className="w-full px-4 py-2 bg-background/80 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="match">Best Match</option>
                <option value="cost">Lowest Cost</option>
                <option value="distance">Nearest Distance</option>
              </select>
            </div>

            {/* Facilities */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground">Required Facilities</label>
              <div className="flex flex-wrap gap-2">
                {facilities.map(facility => (
                  <label key={facility} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background/50 border border-white/10 rounded-full text-xs font-medium text-muted-foreground cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" name="facilities" value={facility} className="rounded text-primary focus:ring-primary/20 border-white/10 w-3.5 h-3.5" />
                    {facility}
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
