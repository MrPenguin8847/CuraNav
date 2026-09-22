import { CheckCircle2, Clock, FlaskConical } from "lucide-react";
import { VerificationStatus } from "@/lib/mockHospitals";

interface VerificationBadgeProps {
  status: VerificationStatus;
  lastVerified: string | null;
}

export function VerificationBadge({ status, lastVerified }: VerificationBadgeProps) {
  const configs: Record<
    VerificationStatus,
    { icon: React.ElementType; label: string; className: string; iconClass: string }
  > = {
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      className: "bg-success/10 text-success border-success/20",
      iconClass: "text-success",
    },
    pending: {
      icon: Clock,
      label: "Pending Verification",
      className: "bg-warning/10 text-warning border-warning/20",
      iconClass: "text-warning",
    },
    simulated: {
      icon: FlaskConical,
      label: "Simulated Demo Data",
      className: "bg-muted/10 text-muted border-muted/20",
      iconClass: "text-muted",
    },
  };

  const { icon: Icon, label, className, iconClass } = configs[status];

  const dateLabel = lastVerified
    ? new Date(lastVerified).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
      <span>{label}</span>
      {dateLabel && <span className="opacity-60">· {dateLabel}</span>}
    </div>
  );
}
