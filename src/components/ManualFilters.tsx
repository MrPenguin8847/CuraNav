"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, Search, Info } from "lucide-react";
import { getEstimatedCost } from "@/lib/costEstimator";

interface ManualFiltersProps {
  initiallyOpen?: boolean;
}

export function ManualFilters({ initiallyOpen = false }: ManualFiltersProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") || "");
  const [budget, setBudget] = useState(searchParams.get("max_budget") || "");
  const [minBudget, setMinBudget] = useState(searchParams.get("min_budget") || "");
  const [radiusKm, setRadiusKm] = useState(searchParams.get("radius_km") || "");
  
  const initialFacilities = searchParams.get("facilities")?.split(",") || [];
  const [facilities, setFacilities] = useState({
    ICU: initialFacilities.includes("ICU"),
    Emergency: initialFacilities.includes("Emergency"),
    Dialysis: initialFacilities.includes("Dialysis"),
    NICU: initialFacilities.includes("NICU"),
  });

  const suggestedCost = specialty ? getEstimatedCost(specialty) : null;

  useEffect(() => {
    const q = condition.toLowerCase();
    if (!q) return;
    if (q.includes("heart") || q.includes("cardiac") || q.includes("cardio")) setSpecialty("Cardiology");
    else if (q.includes("kidney") || q.includes("dialysis") || q.includes("renal")) setSpecialty("Nephrology");
    else if (q.includes("cancer") || q.includes("tumor") || q.includes("oncol") || q.includes("chemo")) setSpecialty("Oncology");
    else if (q.includes("bone") || q.includes("joint") || q.includes("ortho") || q.includes("fracture")) setSpecialty("Orthopedics");
    else if (q.includes("brain") || q.includes("neuro") || q.includes("stroke") || q.includes("nerve")) setSpecialty("Neurology");
    else if (q.includes("child") || q.includes("pediatric") || q.includes("baby") || q.includes("infant")) setSpecialty("Pediatrics");
    else if (q.includes("eye") || q.includes("vision") || q.includes("cataract") || q.includes("opthal")) setSpecialty("Ophthalmology");
    else if (q.includes("skin") || q.includes("derma") || q.includes("acne")) setSpecialty("Dermatology");
    else if (q.includes("tooth") || q.includes("teeth") || q.includes("dental") || q.includes("dentist")) setSpecialty("Dentistry");
    else if (q.includes("stomach") || q.includes("digest") || q.includes("gastro")) setSpecialty("Gastroenterology");
    else if (q.includes("lung") || q.includes("breath") || q.includes("asthma") || q.includes("pulmo")) setSpecialty("Pulmonology");
    else if (q.includes("women") || q.includes("pregnan") || q.includes("matern") || q.includes("gyne")) setSpecialty("Gynecology");
  }, [condition]);
  
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (city.trim()) params.set("city", city.trim());
    if (condition.trim()) params.set("condition", condition.trim());
    if (specialty.trim()) params.set("specialty", specialty.trim());
    if (budget.trim()) params.set("max_budget", budget.trim());
    if (minBudget.trim()) params.set("min_budget", minBudget.trim());
    if (radiusKm.trim()) params.set("radius_km", radiusKm.trim());

    const selectedFacilities = Object.entries(facilities)
      .filter(([_, isSelected]) => isSelected)
      .map(([fac]) => fac);
      
    if (selectedFacilities.length > 0) {
      params.set("facilities", selectedFacilities.join(","));
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setCity("");
    setCondition("");
    setSpecialty("");
    setBudget("");
    setMinBudget("");
    setRadiusKm("");
    setFacilities({
      ICU: false,
      Emergency: false,
      Dialysis: false,
      NICU: false,
    });
    router.push(pathname);
  };

  const handleFacilityChange = (fac: keyof typeof facilities) => {
    setFacilities(prev => ({ ...prev, [fac]: !prev[fac] }));
  };

  return (
    <div className="glass bg-background/50 rounded-2xl border border-white/10 shadow-sm mb-6 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-background hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Filter className="w-5 h-5 text-primary" />
          Manual Filter
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {isOpen ? "Hide" : "Show"} options
        </span>
      </button>

      {isOpen && (
        <form onSubmit={handleApply} className="p-4 md:p-6 border-t border-white/10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chandigarh"
                className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disease / Condition</label>
              <input 
                type="text" 
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Heart attack"
                className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specialty</label>
              <input 
                type="text" 
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology"
                className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Radius (km)</label>
              <input 
                type="number" 
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                placeholder="e.g. 20"
                className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Range (₹)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                />
                <input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-2.5 bg-background/80 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
              {suggestedCost && (
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-400 leading-tight">
                    Estimated avg: <strong>₹{suggestedCost.min.toLocaleString('en-IN')} - ₹{suggestedCost.max.toLocaleString('en-IN')}</strong> for {specialty}.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Facilities</label>
             <div className="flex flex-wrap gap-2">
                {Object.keys(facilities).map((fac) => (
                  <label
                    key={fac}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                      facilities[fac as keyof typeof facilities]
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-background/50 border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={facilities[fac as keyof typeof facilities]}
                      onChange={() => handleFacilityChange(fac as keyof typeof facilities)}
                    />
                    <span className="text-sm">{fac}</span>
                  </label>
                ))}
             </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
            <button 
              type="button"
              onClick={handleClear}
              className="px-5 py-2.5 border border-white/10 text-muted-foreground rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Clear Filters
            </button>
            <button 
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            >
              <Search className="w-4 h-4" />
              Search with Filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
