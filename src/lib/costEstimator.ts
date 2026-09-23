export const estimatedCosts: Record<string, { min: number, max: number }> = {
  "Cardiology": { min: 50000, max: 500000 },
  "Nephrology": { min: 30000, max: 200000 },
  "Oncology": { min: 100000, max: 1000000 },
  "Orthopedics": { min: 40000, max: 350000 },
  "Neurology": { min: 60000, max: 600000 },
  "Pediatrics": { min: 10000, max: 100000 },
  "Ophthalmology": { min: 15000, max: 100000 },
  "Dermatology": { min: 5000, max: 50000 },
  "Dentistry": { min: 2000, max: 50000 },
  "Gastroenterology": { min: 20000, max: 250000 },
  "Pulmonology": { min: 25000, max: 300000 },
  "Gynecology": { min: 30000, max: 200000 },
  "General Medicine": { min: 5000, max: 50000 },
  "General Surgery": { min: 30000, max: 150000 },
};

export function getEstimatedCost(specialty: string): { min: number, max: number } | null {
  return estimatedCosts[specialty] || null;
}
