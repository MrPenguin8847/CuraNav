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
        <div className="mt-4 p-6 bg-white rounded-2xl shadow-sm border border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Specialty / Condition */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Specialty / Condition</label>
              <select 
                name="specialty" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
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
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="location" 
                  placeholder="Enter city or pin code" 
                  className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button 
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-xs font-medium text-slate-700 rounded transition-colors"
                >
                  Use my location
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Budget Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                  <input 
                    type="number" 
                    name="minBudget" 
                    placeholder="Min" 
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                  <input 
                    type="number" 
                    name="maxBudget" 
                    placeholder="Max" 
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            {/* Sort Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Sort Priority</label>
              <select 
                name="sort" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="match">Best Match</option>
                <option value="cost">Lowest Cost</option>
                <option value="distance">Nearest Distance</option>
              </select>
            </div>

            {/* Facilities */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Required Facilities</label>
              <div className="flex flex-wrap gap-2">
                {facilities.map(facility => (
                  <label key={facility} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" name="facilities" value={facility} className="rounded text-primary focus:ring-primary/20 border-slate-300 w-3.5 h-3.5" />
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
