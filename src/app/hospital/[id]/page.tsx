import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  ExternalLink,
  IndianRupee,
  Zap,
  ZapOff,
  CheckCircle2,
  BedDouble,
  Activity,
  GitCompare,
  ShieldCheck,
  AlertTriangle,
  FileText,
  SearchX,
  TrendingUp,
  Award,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { Hospital } from "@/lib/mockHospitals";

import { supabaseAdmin } from "@/lib/supabase";
import { mapHospital } from "@/lib/mapHospital";

// ─── Fetch from real API ──────────────────────────────────────────────────────
// This is a server component — fetching happens at request time on the server.
async function getHospital(id: string): Promise<Hospital | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .select("*")
      .eq("hospital_id", id)
      .single();

    if (error || !data) {
      return null;
    }
    return mapHospital(data);
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCost = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const SOURCE_LABELS: Record<string, string> = {
  official: "Official source (government or hospital website)",
  public: "Public source (directory or news archive)",
  synthetic: "Synthetic / simulated — created for prototype demonstration",
};

// ─── Section card wrapper ──────────────────────────────────────────────────────
function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 md:p-6 ${className}`}>
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Not-found state — styled consistently, not the Next.js default 404 ──────
function HospitalNotFound({ id }: { id: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-background/50 border border-white/10 flex items-center justify-center mb-5">
          <SearchX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Hospital not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          We couldn&apos;t find a hospital with ID{" "}
          <code className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono">
            {id}
          </code>
          . It may have been removed or the link may be incorrect.
        </p>
        <Link href="/search" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>
      </main>
      <Footer />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hospital = await getHospital(id);
  if (!hospital) return <HospitalNotFound id={id} />;

  const {
    hospitalId,
    name,
    city,
    specialties,
    costMin,
    costMax,
    facilities,
    accreditation,
    pmjayEmpanelled,
    annualProcedureVolume,
    verificationStatus,
    lastVerified,
    sourceType,
    address,
    phone,
    emergencyAvailable,
    latitude,
    longitude,
    procedures,
    icuBeds,
    sourceUrl,
    outcomeMetric,
  } = {
    ...hospital,
    // Fields that exist in DB — guard gracefully
    phone: hospital.phone ?? "Contact hospital directly",
    emergencyAvailable: hospital.specialties?.some(s => s.includes("Emergency")) ?? false,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    procedures: hospital.procedures ?? [],
    icuBeds: hospital.icuBeds ?? 0,
    sourceUrl: hospital.sourceUrl,
    outcomeMetric: hospital.outcomeMetric ?? "",
  };

  const mapsUrl = (latitude != null && longitude != null)
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ' ' + (address ?? ''))}`;
  const matchingSpecialty = specialties[0] ?? "General";

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">
        {/* ── Back link ── */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>

        {/* ── 1. HEADER BLOCK ── */}
        <div className="card p-5 md:p-7">
          <div className="flex flex-wrap gap-2 mb-3">
            <VerificationBadge status={verificationStatus} lastVerified={lastVerified} />
            {pmjayEmpanelled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PM-JAY Empanelled
              </span>
            )}
            {accreditation.map((a) => (
              <span
                key={a}
                className="px-2.5 py-1 bg-background/50 text-muted-foreground text-xs font-semibold rounded-full border border-white/10"
              >
                {a}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-2">
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mb-6">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {city ?? hospital.address ?? "India"}
            </span>
            <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {matchingSpecialty}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${phone}`}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Hospital
              <span className="opacity-75 font-normal text-sm">{phone}</span>
            </a>
            <Link
              href={`/compare?ids=${hospitalId}`}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Add to Compare
            </Link>
          </div>
        </div>

        {/* ── 2. OVERVIEW ── */}
        <Section title="Overview">
          <dl className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</dt>
                <dd className="text-sm text-foreground mt-0.5">{address}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</dt>
                <dd className="mt-0.5">
                  <a href={`tel:${phone}`} className="text-sm text-primary font-medium hover:underline">
                    {phone}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {emergencyAvailable ? (
                <Zap className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <ZapOff className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              )}
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">24×7 Emergency</dt>
                <dd className={`text-sm font-semibold mt-0.5 ${emergencyAvailable ? "text-success" : "text-warning"}`}>
                  {emergencyAvailable
                    ? "Available — 24-hour emergency department"
                    : "Not available — confirm current hours with hospital"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</dt>
                <dd className="mt-0.5">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                  >
                    Get Directions
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </dd>
              </div>
            </div>
          </dl>
        </Section>

        {/* ── 3. SPECIALTIES & PROCEDURES ── */}
        <Section title="Specialties & Procedures">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <span key={s} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Procedures offered</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {procedures.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── 4. FACILITIES & SERVICES ── */}
        <Section title="Facilities & Services">
          <div className="flex flex-wrap gap-2 mb-4">
            {facilities.map((f) => {
              const Icon = FACILITY_ICONS[f] ?? Activity;
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 glass bg-background/50 border border-white/10 rounded-full text-xs font-medium text-muted-foreground shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {f}
                </span>
              );
            })}
          </div>
          {icuBeds > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/50 border border-white/10 rounded-xl text-sm">
              <BedDouble className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{icuBeds}</span>
              <span className="text-slate-400">ICU beds (indicative)</span>
            </div>
          )}
        </Section>

        {/* ── 5. PERFORMANCE & CERTIFICATION DASHBOARD ── */}
        <Section title="Performance & Certification Dashboard">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Average Costs */}
            <div className="p-4 bg-background/50 rounded-xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Cost</h3>
              </div>
              <div className="space-y-3 mt-1">
                {/* Private Cost */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Private / Uninsured</span>
                  <p className="text-xl font-extrabold text-foreground tracking-tight">
                    {costMin != null && costMax != null
                      ? `${formatCost(costMin)} – ${formatCost(costMax)}`
                      : "Contact for pricing"}
                  </p>
                </div>
                {/* PM-JAY Cost */}
                {pmjayEmpanelled && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-0.5">PM-JAY (Govt)</span>
                    <span className="inline-flex items-center gap-1 text-success font-semibold text-sm bg-success/10 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      Standard Rates (Free)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Volumes */}
            <div className="p-4 bg-background/50 rounded-xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Volumes</h3>
              </div>
              <p className="text-xl font-extrabold text-foreground tracking-tight">
                {annualProcedureVolume != null ? `${annualProcedureVolume.toLocaleString("en-IN")}` : "N/A"}
              </p>
              <p className="text-xs text-slate-400 mt-1">procedures/year (reported)</p>
            </div>

            {/* Outcomes */}
            <div className="p-4 bg-background/50 rounded-xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reported Outcomes</h3>
              </div>
              <p className="text-sm font-semibold text-foreground italic">
                {outcomeMetric ? `"${outcomeMetric}"` : "N/A"}
              </p>
            </div>

            {/* Verified Certifications */}
            <div className="p-4 bg-background/50 rounded-xl border border-white/10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certifications</h3>
              </div>
              <div className="space-y-2">
                <VerificationBadge status={verificationStatus} lastVerified={lastVerified} />
                {accreditation.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {accreditation.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-background/50 text-muted-foreground text-xs font-semibold rounded-full border border-white/10">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </Section>

        {/* ── 6. TRUST PANEL ── */}
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 md:p-7 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Data Transparency & Trust</h2>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verification status</p>
            <VerificationBadge status={verificationStatus} lastVerified={lastVerified} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data source type</p>
            <p className="text-sm text-foreground font-medium">{SOURCE_LABELS[sourceType] ?? sourceType}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Source reference</p>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                View source
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No external source linked — synthetic data for prototype
              </p>
            )}
          </div>



          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-warning uppercase tracking-wider mb-1">Limitations</p>
              <p className="text-sm text-warning/80 leading-relaxed">
                This record is provided for demonstration. Some or all statistics may be simulated. Verify cost,
                availability, and treatment suitability directly with the hospital before making any clinical or
                financial decisions.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
