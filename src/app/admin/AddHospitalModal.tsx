"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";

interface AddHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddHospitalModal({ isOpen, onClose, onSuccess }: AddHospitalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          city: data.city,
          state: data.state,
          cost_min: data.cost_min,
          cost_max: data.cost_max,
          specialties: data.specialties,
          facilities: data.facilities,
          pmjay_empanelled: data.pmjay_empanelled === "on"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add hospital");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add Demo Hospital</h2>
            <p className="text-xs text-slate-500">Record will be tagged as &quot;Simulated Demo Data&quot;</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form id="add-hospital-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Hospital Name</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Apollo Hospital" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">City</label>
                <input required name="city" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Chandigarh" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">State</label>
                <input required name="state" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Punjab" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">PM-JAY Empanelled</label>
                <div className="flex items-center h-[42px] px-3 border border-slate-200 rounded-lg">
                  <input name="pmjay_empanelled" type="checkbox" className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded" />
                  <span className="ml-2 text-sm text-slate-600">Yes, empanelled</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Min Cost (₹)</label>
                <input required name="cost_min" type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="50000" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Max Cost (₹)</label>
                <input required name="cost_max" type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="200000" />
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <label className="text-xs font-semibold text-slate-600 uppercase">Specialties (comma separated)</label>
              <input required name="specialties" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Cardiology, Orthopedics" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Facilities (comma separated)</label>
              <input required name="facilities" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. ICU, Blood Bank, 24/7 Pharmacy" />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-hospital-form" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
