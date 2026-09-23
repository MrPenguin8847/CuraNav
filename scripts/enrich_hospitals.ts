import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual simple dotenv loading to avoid dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if they exist
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENROUTER_API_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_KEY:', !!SUPABASE_KEY);
  console.error('OPENROUTER_API_KEY:', !!OPENROUTER_API_KEY);
  console.error('Loaded from:', envPath, 'exists:', fs.existsSync(envPath));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYSTEM_PROMPT = `You are a medical data enrichment AI. Given a hospital's name, address, and current broad specialties, your job is to identify highly specific specialties and conditions this hospital likely treats.

Instructions:
1. Look at the hospital name. If it's a primary health center (PHC or CHC), it handles General Medicine, Maternity, and basic care. If it's a Super Specialty hospital or larger city hospital, it handles Cardiology, Nephrology, Oncology, Neurology, etc.
2. Output valid JSON only.
3. Add 2-4 highly specific specialties to the "new_specialties" array (e.g. "Nephrology", "Cardiology", "Oncology").
4. Add 2-4 common plain-english condition keywords to the "condition_tag" string, separated by commas (e.g. "kidney disease, heart disease, cancer").

Format:
{
  "new_specialties": ["Specialty1", "Specialty2"],
  "condition_tag": "condition1, condition2"
}`;

async function enrichHospital(hospital: any) {
  const query = `Hospital Name: ${hospital.name}\nAddress: ${hospital.address}, ${hospital.city || ''}\nCurrent Specialties: ${(hospital.specialties || []).join(", ")}`;
  
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // fast and cheap
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    console.error(`  [!] AI Enrichment failed for ${hospital.name}:`, err);
    return null;
  }
}

async function run() {
  console.log("Fetching hospitals from Supabase...");
  const { data: hospitals, error } = await supabase.from('hospitals').select('*');
  
  if (error || !hospitals) {
    console.error("Failed to fetch hospitals:", error);
    process.exit(1);
  }

  console.log(`Found ${hospitals.length} hospitals. Beginning enrichment...`);

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    console.log(`[${i+1}/${hospitals.length}] Enriching: ${h.name}...`);
    
    // Skip if we already enriched it heavily (basic check)
    if (h.condition_tag && h.condition_tag.length > 10 && h.specialties.includes('Nephrology')) {
      console.log(`  -> Already enriched, skipping.`);
      continue;
    }

    const aiData = await enrichHospital(h);
    if (aiData) {
      // Merge specialties and remove duplicates
      const currentSpecialties = new Set(h.specialties || []);
      (aiData.new_specialties || []).forEach((s: string) => currentSpecialties.add(s));
      const mergedSpecialties = Array.from(currentSpecialties);

      // Append or set condition_tag
      let newConditionTag = h.condition_tag || "";
      if (aiData.condition_tag) {
        newConditionTag = newConditionTag ? `${newConditionTag}, ${aiData.condition_tag}` : aiData.condition_tag;
      }

      // Update Supabase
      const { error: updateError } = await supabase
        .from('hospitals')
        .update({
          specialties: mergedSpecialties,
          condition_tag: newConditionTag
        })
        .eq('hospital_id', h.hospital_id);

      if (updateError) {
        console.error(`  [!] Failed to update DB for ${h.name}:`, updateError);
      } else {
        console.log(`  -> Success. Added: ${aiData.new_specialties?.join(', ')}`);
      }
    }
    
    // Avoid hammering the API too fast
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("Enrichment complete!");
}

run();
