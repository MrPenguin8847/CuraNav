"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, MapPin, Stethoscope, IndianRupee, Activity, Loader2, Pill, Info } from "lucide-react";
import { getEstimatedCost } from "@/lib/costEstimator";

export default function FindHospitalPage() {
  const router = useRouter();
  
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [locating, setLocating] = useState(false);
  
  // Basic facilities check
  const [facilities, setFacilities] = useState({
    ICU: false,
    Emergency: false,
    Dialysis: false,
    NICU: false,
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

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "CuraNav/1.0" } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            "";
          if (detectedCity) setCity(detectedCity);
        } catch {} 
        finally { setLocating(false); }
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleFacilityChange = (fac: keyof typeof facilities) => {
    setFacilities(prev => ({ ...prev, [fac]: !prev[fac] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (specialty.trim()) params.set("specialty", specialty.trim());
    if (maxBudget.trim()) params.set("max_budget", maxBudget.trim());
    
    const selectedFacilities = Object.entries(facilities)
      .filter(([_, isSelected]) => isSelected)
      .map(([fac]) => fac);
      
    if (selectedFacilities.length > 0) {
      params.set("facilities", selectedFacilities.join(","));
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          <div className="bg-gradient-to-br from-primary to-secondary p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Find Your Hospital</h1>
              <p className="text-primary-foreground/80 max-w-md mx-auto">
                Enter your exact requirements below to find the best healthcare facilities tailored for you.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="w-4 h-4 text-primary" />
                    City / Location
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={locating}
                    className="text-xs text-primary font-semibold hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    Use my location
                  </button>
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune, Delhi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Disease */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Pill className="w-4 h-4 text-primary" />
                  Disease / Condition
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Heart attack, Kidney failure"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              
              {/* Specialty */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  Medical Specialty (Auto-detected)
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, Orthopedics"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <IndianRupee className="w-4 h-4 text-primary" />
                Maximum Budget (Optional)
              </label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="text-xs text-slate-500 ml-1">Leave blank if budget is not a constraint.</p>
              {suggestedCost && (
                <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Estimated cost for <strong>{specialty}</strong> treatments usually ranges between <strong>₹{suggestedCost.min.toLocaleString('en-IN')}</strong> and <strong>₹{suggestedCost.max.toLocaleString('en-IN')}</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Facilities */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Activity className="w-4 h-4 text-primary" />
                Required Facilities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(facilities).map((fac) => (
                  <label
                    key={fac}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      facilities[fac as keyof typeof facilities]
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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

            <div className="pt-6">
              <button
                type="submit"
                className="w-full btn-primary py-4 text-lg font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Hospitals
              </button>
            </div>
            
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
