import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manual simple dotenv loading to avoid dependencies
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables:");
  console.error("SUPABASE_URL:", !!SUPABASE_URL);
  console.error("SUPABASE_KEY:", !!SUPABASE_KEY);
  console.error("Loaded from:", envPath, "exists:", fs.existsSync(envPath));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`,
      { headers: { "User-Agent": "CuraNav/1.0 (https://curanav.vercel.app)" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
    }
    return null;
  } catch {
    return null;
  }
}

async function run() {
  console.log("Fetching hospitals from Supabase...");
  const { data: hospitals, error } = await supabase
    .from("hospitals")
    .select("*")
    .or("latitude.is.null,longitude.is.null");

  if (error || !hospitals) {
    console.error("Failed to fetch hospitals:", error);
    process.exit(1);
  }

  console.log(`Found ${hospitals.length} hospitals missing coordinates. Beginning geocoding...`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const locationParts = [
      h.name,
      h.address,
      h.city,
      h.state,
      h.pincode,
    ].filter(Boolean);
    const query = locationParts.join(", ");

    console.log(`[${i + 1}/${hospitals.length}] Geocoding: ${h.name}`);

    if (query.length < 10) {
      console.log(`  -> Query too short, skipping.`);
      skipped++;
      continue;
    }

    const coords = await geocode(query);
    if (coords) {
      const { error: updateError } = await supabase
        .from("hospitals")
        .update({ latitude: coords.lat, longitude: coords.lon })
        .eq("hospital_id", h.hospital_id);

      if (updateError) {
        console.error(`  [!] Failed to update DB for ${h.name}:`, updateError.message);
      } else {
        updated++;
        console.log(`  -> ${coords.lat}, ${coords.lon}`);
      }
    } else {
      console.log(`  -> No match found.`);
      skipped++;
    }

    // Nominatim requires ~1 req/sec from a single IP
    await sleep(1100);
  }

  console.log(`\nGeocoding complete! Updated: ${updated}, Skipped: ${skipped}`);
}

run();