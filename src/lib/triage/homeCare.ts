import type { HomeCareEntry } from "./types";

/**
 * Vetted home-care catalogue.
 *
 * SAFETY CONTRACT — this is the only place where home-care text exists in the
 * entire feature. The AI layer may only *select a key* from this map; it can
 * never contribute, extend, or paraphrase any advice. That is why the response
 * validator drops unrecognised keys instead of passing them through, and why
 * there is no free-text advice field anywhere in the triage schema.
 *
 * Authoring rules for entries below:
 *  - No prescription medicines, no drug names, no dosages, no antibiotics.
 *  - No herbal, Ayurvedic, Unani or homeopathic preparations.
 *  - No "cure", "guaranteed", "will heal" or any efficacy claim.
 *  - `stopIf` is mandatory on every entry. It is the safety net that makes the
 *    `self_care` tier defensible.
 *  - Only low-risk, reversible supportive measures.
 */

export const HOME_CARE_CATALOG: Readonly<Record<string, HomeCareEntry>> = {
  rest_hydration: {
    key: "rest_hydration",
    title: "Rest and keep fluids coming",
    why: "Most short illnesses are helped by letting the body direct energy toward recovery, and by replacing the fluid you are losing through fever, sweating or vomiting.",
    do: [
      "Drink small sips of water often rather than large amounts at once",
      "Aim for light, frequent fluids through the day",
      "Rest as much as you can without staying in bed for long stretches",
    ],
    avoid: [
      "Alcohol while you are unwell",
      "Very sugary or heavily salted drinks",
    ],
    stopIf: "You cannot keep fluids down, you have not passed urine in 8 hours, or you feel faint on standing.",
  },

  oral_rehydration_salt: {
    key: "oral_rehydration_salt",
    title: "Oral rehydration solution",
    why: "ORS replaces both the water and the salts lost through vomiting or diarrhoea, which plain water alone cannot do.",
    do: [
      "Dissolve one sachet in the exact volume of water printed on the packet",
      "Sip frequently in small amounts",
      "Keep a prepared sachet with you if you are travelling or have young children",
    ],
    avoid: [
      "Making the solution stronger than the packet states",
      "Using sugar, milk or juice in place of the specified water",
      "Reusing a sachet prepared more than 24 hours ago",
    ],
    stopIf: "You are vomiting everything you drink, or there is no urine for 8 hours or more.",
  },

  steam_inhalation: {
    key: "steam_inhalation",
    title: "Steam inhalation for congestion",
    why: "Warm water vapour helps loosen thick mucus in the nose and airways so it can be cleared more easily.",
    do: [
      "Sit over a bowl of hot water with a towel over your head",
      "Inhale the vapour for 5 to 10 minutes, up to 3 times a day",
      "Keep a glass of water nearby",
    ],
    avoid: [
      "Putting your face directly over the water — it can scald",
      "Leaving a child alone with hot steam",
      "Using a humidifier at a temperature that feels too warm on the skin",
    ],
    stopIf: "Breathing becomes harder, you feel dizzy, or you develop chest pain.",
  },

  saline_nasal_rinse: {
    key: "saline_nasal_rinse",
    title: "Saline nasal rinse",
    why: "Saline flushes irritants and mucus from the nasal passages, reducing stuffiness without numbing you.",
    do: [
      "Use a sterile saline sachet or a rinse bottle filled with boiled and cooled water",
      "Rinse while leaning forward over a sink",
      "Rinse once or twice a day",
    ],
    avoid: [
      "Tap water straight from the tap without boiling and cooling it",
      "Forcing water hard into a nostril",
      "Sharing a rinse bottle between people",
    ],
    stopIf: "Your ear becomes painful, or you notice blood in the discharge.",
  },

  warm_compress: {
    key: "warm_compress",
    title: "Warm compress for muscle pain",
    why: "Gentle heat relaxes tight muscles and improves local blood flow, which eases aching and stiffness.",
    do: [
      "Apply a warm (not hot) cloth or heat pack for 15 to 20 minutes",
      "Repeat every 2 to 3 hours while you are awake",
      "Keep the skin covered and check it periodically",
    ],
    avoid: [
      "Sleeping on a heating pad overnight",
      "Applying heat to swollen, numb or recently injured skin",
      "Very hot compresses — burns are easy and painless to acquire",
    ],
    stopIf: "The area becomes redder, more painful or starts to blister.",
  },

  cold_compress: {
    key: "cold_compress",
    title: "Cold compress for recent injury or headache",
    why: "In the first day or two after an injury, cooling narrows blood vessels and limits swelling and bruising.",
    do: [
      "Apply a wrapped cold pack for 15 to 20 minutes at a time",
      "Repeat every 2 to 3 hours during the first 48 hours",
      "Wait at least 2 hours between applications",
    ],
    avoid: [
      "Placing ice directly on bare skin",
      "Using ice for more than 48 hours after an injury",
      "Using ice on a stiff or painful joint without checking with a doctor first",
    ],
    stopIf: "Skin turns white, numb or blistered.",
  },

  rest_affected_limb: {
    key: "rest_affected_limb",
    title: "Rest and support the affected area",
    why: "Unloading a sprained or strained area prevents further injury while the tissues recover.",
    do: [
      "Stop the activity that causes pain",
      "Use a sling or elastic bandage for support if it is an arm or shoulder",
      "Gently move the area within a comfortable range a few times a day",
    ],
    avoid: [
      "Forcing the joint through its full range",
      "Starting massage in the first 48 hours",
      "Returning to the activity before pain has settled",
    ],
    stopIf: "The joint looks deformed, you cannot bear weight, or there is numbness or colour change beyond the injury.",
  },

  light_diet: {
    key: "light_diet",
    title: "Eat small, simple meals",
    why: "An unsettled stomach handles small, low-fat meals far better than large or rich ones.",
    do: [
      "Eat small amounts of plain, familiar food every few hours",
      "Choose rice, plain toast, bananas, curd or boiled potatoes",
      "Keep food at room temperature rather than very hot or very cold",
    ],
    avoid: [
      "Very fatty, fried or spicy food",
      "Large meals",
      "Alcohol",
    ],
    stopIf: "Vomiting continues past 24 hours, or you develop severe abdominal pain.",
  },

  avoid_late_meals: {
    key: "avoid_late_meals",
    title: "Eat earlier and raise your head when lying down",
    why: "Reflux happens when stomach contents flow back into the oesophagus, which lying flat and late meals make worse.",
    do: [
      "Finish eating at least 3 hours before lying down",
      "Raise the head of the bed by 10 to 15 cm using blocks under the bed legs",
      "Try smaller evening meals",
    ],
    avoid: [
      "Bending over or exercising straight after eating",
      "Tight belts or waistbands after meals",
      "Smoking and alcohol, which relax the valve that keeps acid out",
    ],
    stopIf: "You have difficulty or pain swallowing, are vomiting blood, or are losing weight without trying.",
  },

  antiseptic_cleaning: {
    key: "antiseptic_cleaning",
    title: "Clean a minor cut and keep it covered",
    why: "Most small cuts heal on their own if kept clean, so infection prevention matters more than any dressing.",
    do: [
      "Rinse under clean running water for several minutes",
      "Wipe the surrounding skin with an antiseptic wipe or soapy water",
      "Cover with a clean plaster and change it daily or when damp",
    ],
    avoid: [
      "Pouring hydrogen peroxide, iodine concentrate or antiseptic directly into the wound — they slow healing",
      "Using a plaster you are allergic to",
    ],
    stopIf: "The wound edges open, you see spreading redness or red streaks, there is pus, or you develop a fever.",
  },

  limit_sun_exposure: {
    key: "limit_sun_exposure",
    title: "Reduce sun exposure for a skin reaction",
    why: "Many rashes flare with heat, sweat and ultraviolet light, so reducing exposure limits further irritation.",
    do: [
      "Stay in the shade between 10 am and 4 pm",
      "Wear loose, breathable cotton clothing",
      "Use an unscented, gentle moisturiser on dry or irritated skin",
    ],
    avoid: [
      "Fragranced, medicated or steroid creams you have not been advised to use",
      "Scratching, which worsens most rashes",
      "New cosmetics or detergents, which are a common trigger",
    ],
    stopIf: "The rash spreads rapidly, blisters, becomes painful, or you develop a fever.",
  },

  avoid_triggers: {
    key: "avoid_triggers",
    title: "Avoid whatever reliably sets it off",
    why: "For allergies, reflux, asthma and headaches, specific triggers are usually far more avoidable than most people assume.",
    do: [
      "Keep a short diary of what you ate, did and where you were, and mark reactions",
      "Cut the single most obvious trigger for 2 weeks and see whether it changes",
      "Change to unscented, dye-free products for skin or breathing reactions",
    ],
    avoid: [
      "Self-prescribing new medicines as a preventive measure",
      "Exhaustively removing whole food groups, which usually makes nutrition worse",
    ],
    stopIf: "You develop any of the breathing, swelling or facial symptoms on the red-flag list.",
  },

  elevate_head_when_sleeping: {
    key: "elevate_head_when_sleeping",
    title: "Keep your head raised while resting",
    why: "Postnasal drip and congested sinuses drip backwards when you lie flat, which worsens cough and throat irritation overnight.",
    do: [
      "Use an extra pillow so your head is higher than your chest",
      "Sleep on your side if lying flat makes the cough worse",
      "Clear your nose before lying down",
    ],
    avoid: [
      "Eating or drinking large amounts right before bed",
      "Smoke or vaping, which worsens overnight cough",
    ],
    stopIf: "Cough causes you to wake gasping, you wheeze, or you have chest pain.",
  },

  honey_warm_water: {
    key: "honey_warm_water",
    title: "Honey in warm water for a sore throat",
    why: "Honey coats and soothes an irritated throat, and warm water helps loosen mucus. It is a reasonable stand-in when you do not want to reach for a cough preparation.",
    do: [
      "Dissolve one to two teaspoons of honey in a cup of warm water",
      "Sip slowly two to three times a day",
      "Add a squeeze of lemon if you prefer",
    ],
    avoid: [
      "Honey in infants under 12 months — it carries a botulism risk",
      "Using honey instead of antibiotics for a diagnosed bacterial throat infection",
    ],
    stopIf: "You develop a high fever, cannot swallow saliva, or have a swollen neck with a rash.",
  },

  avoid_strenuous_activity: {
    key: "avoid_strenuous_activity",
    title: "Keep physical activity low",
    why: "When the body is fighting an illness, exertion diverts resources away from recovery and can worsen symptoms such as dizziness or palpitations.",
    do: [
      "Walk only as much as feels comfortable",
      "Return gradually to your usual routine over 2 to 3 days",
    ],
    avoid: [
      "Heavy lifting or exercise, especially with chest discomfort or dizziness",
      "Driving if you feel light-headed",
    ],
    stopIf: "Activity brings on chest pain, breathlessness or fainting.",
  },

  glycemic_monitoring: {
    key: "glycemic_monitoring",
    title: "Keep track of your blood sugar",
    why: "Knowing whether your sugar is high or low helps a clinician decide the cause of your symptoms quickly and safely.",
    do: [
      "Check your blood sugar at the same times each day and note the readings",
      "Record what you ate alongside the readings",
      "Carry something sugary in case your sugar drops",
    ],
    avoid: [
      "Skipping meals or medication without medical advice",
      "Changing your medicine based on a single reading",
    ],
    stopIf: "Blood sugar is very low, or you are confused, vomiting or breathing deeply.",
  },

  log_symptoms: {
    key: "log_symptoms",
    title: "Keep a short symptom diary",
    why: "Writing down when symptoms appear, what triggers them and what relieves them gives a doctor information that memory usually loses.",
    do: [
      "Note the date, time and what you were doing each time a symptom appears",
      "List what you tried and whether it helped",
      "Bring the notes to your appointment",
    ],
    avoid: [
      "Waiting weeks without recording anything, then trying to recall details",
      "Stopping medication because you believe a diary shows it is unnecessary",
    ],
    stopIf: "Any symptom on the red-flag list appears — record it and seek care rather than waiting for your appointment.",
  },

  keep_area_dry: {
    key: "keep_area_dry",
    title: "Keep the affected skin clean and dry",
    why: "Fungal and bacterial skin infections spread through moisture and thrive in warm, damp skin folds.",
    do: [
      "Wash and dry the area daily, drying thoroughly between skin folds",
      "Wear loose cotton clothing and breathable footwear",
      "Change damp socks and underwear daily",
    ],
    avoid: [
      "Sharing towels, clothing or footwear",
      "Covering a rash with a thick, airtight dressing",
      "Applying steroid creams to a suspected fungal infection, which makes it worse",
    ],
    stopIf: "The rash spreads, weeps, becomes painful, or you develop a fever.",
  },

  loose_fiber_intake: {
    key: "loose_fiber_intake",
    title: "Increase fibre gradually and drink more water",
    why: "For constipation, fibre plus adequate fluid is the first-line fix and usually works before any medicine is needed.",
    do: [
      "Add vegetables, whole grains, beans or psyllium to your diet",
      "Increase fibre by small amounts each week rather than all at once",
      "Drink regular fluids through the day",
    ],
    avoid: [
      "Jumping straight to a very high-fibre diet, which causes bloating and gas",
      "Straining on the toilet",
    ],
    stopIf: "You have blood in the stool, unexplained weight loss, or the constipation alternates with diarrhoea.",
  },

  avoid_dairy_temporarily: {
    key: "avoid_dairy_temporarily",
    title: "Skip dairy briefly while your stomach settles",
    why: "When the gut is inflamed, the enzyme that digests milk sugar works less well, so dairy often adds to bloating, cramps and diarrhoea.",
    do: [
      "Avoid milk and soft cheese for 2 to 3 days",
      "Try lactose-free or fermented yoghurt, which is usually tolerated",
      "Reintroduce gradually after symptoms settle",
    ],
    avoid: [
      "Removing calcium sources long-term without another source",
      "Assuming every stomach illness is lactose intolerance",
    ],
    stopIf: "You cannot keep fluids down, or you have blood in your stool or a high fever.",
  },

  pelvic_rest: {
    key: "pelvic_rest",
    title: "Rest and protect an irritated pelvic area",
    why: "When the pelvic area is inflamed, friction, heat and infection make symptoms markedly worse.",
    do: [
      "Use a warm sitz bath for 10 to 15 minutes, 2 to 3 times a day",
      "Wear loose cotton underwear and change out of wet clothing promptly",
      "Keep the area clean with plain water rather than fragranced wipes",
    ],
    avoid: [
      "Douching, which pushes bacteria upward",
      "Fragranced soaps, wipes and detergents in the area",
      "Delaying a review if symptoms last more than a week",
    ],
    stopIf: "You develop high fever, severe one-sided pelvic pain, vomiting, or bleeding that is heavier than a normal period.",
  },

  elevate_affected_limb: {
    key: "elevate_affected_limb",
    title: "Raise a swollen arm or leg",
    why: "Gravity helps fluid drain back toward the heart instead of pooling in the limb, which reduces swelling and throbbing.",
    do: [
      "Rest the limb raised above the level of your heart for 20 minutes, 3 to 4 times a day",
      "Avoid standing or sitting still for long stretches",
      "Move the ankle or wrist gently through its range several times a day",
    ],
    avoid: [
      "Massage of a freshly swollen limb",
      "Wearing tight bands, socks or compression garments without medical advice",
    ],
    stopIf: "One limb becomes much more swollen, red or painful than the other, or you feel short of breath.",
  },
};

/** The complete set of keys the AI layer is allowed to select. */
export const ALLOWED_CARE_KEYS: readonly string[] = Object.keys(HOME_CARE_CATALOG);

/** Keys safe to show for a generic, unmatched complaint. */
export const DEFAULT_CARE_KEYS: readonly string[] = [
  "rest_hydration",
  "log_symptoms",
];

/**
 * Resolves model-proposed keys to catalogue entries. Unknown keys are dropped
 * silently — this is the enforcement point for the safety contract above.
 */
export function resolveCare(
  keys: readonly string[],
  fallbackKeys: readonly string[] = DEFAULT_CARE_KEYS
): { entries: HomeCareEntry[]; accepted: string[]; rejected: string[] } {
  const accepted: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const key of [...keys, ...fallbackKeys]) {
    const entry = HOME_CARE_CATALOG[key];
    if (!entry) {
      rejected.push(key);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push(key);
  }

  return {
    entries: accepted.map((k) => HOME_CARE_CATALOG[k]),
    accepted,
    rejected,
  };
}
