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
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FACILITY_ICONS } from "@/lib/facilityIcons";
import { Hospital } from "@/lib/mockHospitals";

// ─── Fetch from real API ──────────────────────────────────────────────────────
// This is a server component — fetching happens at request time on the server.
async function getHospital(id: string): Promise<Hospital | null> {
  try {
    // Use absolute URL for server-side fetch in Next.js
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/hospitals/${id}`, {
      cache: "no-store", // always fresh — hospital data can change
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data: { hospital: Hospital } = await res.json();
    return data.hospital;
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
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 border-b border-border pb-2">
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
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
          <SearchX className="w-8 h-8 text-muted" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Hospital not found</h1>
        <p className="text-sm text-muted max-w-sm mb-6">
          We couldn&apos;t find a hospital with ID{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
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
  params: { id: string };
}) {
  const hospital = await getHospital(params.id);
  if (!hospital) return <HospitalNotFound id={params.id} />;

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
    // Fields that exist in DB but aren't in root Hospital type — guard gracefully
    phone: (hospital as unknown as Record<string, unknown>).phone as string | undefined ?? "Contact hospital directly",
    emergencyAvailable: (hospital as unknown as Record<string, unknown>).emergencyAvailable as boolean | undefined ?? true,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    procedures: hospital.procedures ?? [],
    icuBeds: hospital.icuBeds ?? 0,
    sourceUrl: hospital.sourceUrl,
    outcomeMetric: hospital.outcomeMetric ?? "",
  };

  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const matchingSpecialty = specialties[0] ?? "General";

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">
        {/* ── Back link ── */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
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
                className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200"
              >
                {a}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-2">
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted mb-6">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {city}
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
              <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-muted uppercase tracking-wider">Address</dt>
                <dd className="text-sm text-foreground mt-0.5">{address}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-muted uppercase tracking-wider">Phone</dt>
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
                <dt className="text-xs font-semibold text-muted uppercase tracking-wider">24×7 Emergency</dt>
                <dd className={`text-sm font-semibold mt-0.5 ${emergencyAvailable ? "text-success" : "text-warning"}`}>
                  {emergencyAvailable
                    ? "Available — 24-hour emergency department"
                    : "Not available — confirm current hours with hospital"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs font-semibold text-muted uppercase tracking-wider">Location</dt>
                <dd className="mt-0.5">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                  >
                    View on Google Maps
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
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <span key={s} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Procedures offered</p>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-full text-xs font-medium text-slate-600 shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {f}
                </span>
              );
            })}
          </div>
          {icuBeds > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm">
              <BedDouble className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{icuBeds}</span>
              <span className="text-muted">ICU beds (indicative)</span>
            </div>
          )}
        </Section>

        {/* ── 5. INDICATIVE COST ── */}
        <Section title="Indicative Cost">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-3">
            <IndianRupee className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {formatCost(costMin)} – {formatCost(costMax)}
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Indicative cost — actual pricing may vary with patient condition, package inclusions, doctor fees,
                consumables, and availability. Confirm with hospital before making any financial decision.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            Procedures/year (reported):{" "}
            <span className="font-semibold text-foreground">
              {annualProcedureVolume.toLocaleString("en-IN")}
            </span>
          </p>
        </Section>

        {/* ── 6. TRUST PANEL ── */}
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 md:p-7 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Data Transparency & Trust</h2>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Verification status</p>
            <VerificationBadge status={verificationStatus} lastVerified={lastVerified} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Data source type</p>
            <p className="text-sm text-foreground font-medium">{SOURCE_LABELS[sourceType] ?? sourceType}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Source reference</p>
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
              <p className="text-sm text-muted italic">
                No external source linked — synthetic data for prototype
              </p>
            )}
          </div>

          {outcomeMetric && (
            <div className="p-4 bg-white/70 rounded-xl border border-primary/15">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Reported data (not a CuraNav claim)
              </p>
              <p className="text-sm text-foreground italic">&ldquo;{outcomeMetric}&rdquo;</p>
              <p className="text-xs text-muted mt-1">
                Reported by the hospital or third-party source. CuraNav has not independently verified this figure.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-warning uppercase tracking-wider mb-1">Limitations</p>
              <p className="text-sm text-slate-700 leading-relaxed">
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
