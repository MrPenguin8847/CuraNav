/**
 * Shared facility → lucide-react icon mapping.
 * Used by HospitalCard (results), HospitalDetailPage, and ComparePage.
 * Keys match the facility string values stored in the DB / returned by the API.
 */
import {
  Droplet,
  Heart,
  BedDouble,
  Syringe,
  Scan,
  FlaskConical,
  Activity,
  Zap,
  Baby,
} from "lucide-react";

export const FACILITY_ICONS: Record<string, React.ElementType> = {
  // Kidney / renal
  Dialysis: Droplet,
  // Beds
  ICU: BedDouble,
  NICU: Baby,
  // Imaging
  MRI: Scan,
  "CT scan": Scan,
  "CT Scan": Scan, // legacy alias
  // Lab
  "Blood Bank": FlaskConical,
  // Cardiac
  "Cath Lab": Heart,
  // Emergency
  "Emergency Department": Zap,
  Emergency: Zap, // legacy alias
  // Oncology
  "Oncology Unit": Activity,
  // Surgery
  "Robotic Surgery": Syringe,
  // Ambulance
  "Ambulance Service": Activity,
};
