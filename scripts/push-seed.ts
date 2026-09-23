import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { mockHospitals } from '../mockHospitals';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Clearing existing hospitals...');
  const { error: deleteError } = await supabase.from('hospitals').delete().neq('hospital_id', '0');
  if (deleteError) {
    console.error('Error deleting hospitals:', deleteError);
  }

  console.log(`Inserting ${mockHospitals.length} hospitals with success rates...`);
  
  const mapped = mockHospitals.map(h => ({
    hospital_id: h.hospitalId,
    name: h.name,
    city: h.city,
    state: h.state,
    pincode: h.pincode,
    address: h.address,
    latitude: h.latitude,
    longitude: h.longitude,
    specialties: h.specialties,
    procedures: h.procedures,
    cost_min: h.costMin,
    cost_max: h.costMax,
    currency: h.currency,
    facilities: h.facilities,
    accreditation: h.accreditation,
    pmjay_empanelled: h.pmjayEmpanelled,
    annual_procedure_volume: h.annualProcedureVolume,
    outcome_metric: h.outcomeMetric,
    icu_beds: h.icuBeds,
    source_type: h.sourceType,
    verification_status: h.verificationStatus,
    source_url: h.sourceUrl,
    last_verified: h.lastVerified,
    last_updated: h.lastUpdated,
    data_status: h.dataStatus,
    condition_tag: h.conditionTag,
    review_status: h.reviewStatus,
    phone: h.phone,
    facility_type: h.facilityType,
    date_of_establishment: h.dateOfEstablishment,
    success_rates: h.successRates || {}
  }));

  const { error: insertError } = await supabase.from('hospitals').insert(mapped);
  
  if (insertError) {
    console.error('Error inserting hospitals:', insertError);
  } else {
    console.log('Seed complete!');
  }
}

seed();
