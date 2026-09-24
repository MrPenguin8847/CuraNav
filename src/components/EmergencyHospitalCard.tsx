"use client";

import Link from "next/link";
import { MapPin, Navigation, Phone, Siren, Building2 } from "lucide-react";
import { Hospital } from "@/lib/mockHospitals";

interface EmergencyHospitalCardProps {
  hospital: Hospital;
  rank: number;
}

export function EmergencyHospitalCard({ hospital, rank }: EmergencyHospitalCardProps) {
  const { hospitalId, name, city, address, latitude, longitude, phone, specialties, distance_km } =
    hospital;

  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          name + " " + (address ?? "")
        )}`;

  const emergencySpec =
    specialties.find((s) => s.toLowerCase().includes("emergency")) ??
    specialties[0] ??
    "Emergency Care";

  return (
    <article className="card p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center mt-0.5">
            <Building2 className="w-4.5 h-4.5 text-error" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">
              {rank === 1 ? "Closest match" : `${rank}${rank === 2 ? "nd" : "rd"} nearest`}
            </p>
            <h3 className="text-lg font-bold text-foreground leading-snug">{name}</h3>
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-error/10 text-error text-xs font-semibold rounded-full border border-error/20">
              <Siren className="w-3 h-3" />
              {emergencySpec}
            </span>
          </div>
        </div>
        {distance_km != null && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-lg border border-primary/20">
            <MapPin className="w-3.5 h-3.5" />
            {distance_km.toFixed(1)} km
          </span>
        )}
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <span>{[address, city].filter(Boolean).join(", ") || "Address not available"}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Hospital
          </a>
        )}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold bg-primary-light text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Directions
        </a>
        <Link
          href={`/hospital/${hospitalId}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-white/10 glass text-foreground hover:bg-white/10 transition-colors"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}