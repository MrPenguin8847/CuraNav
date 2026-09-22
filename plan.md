# CuraNav — Project Context and Product Specification

## Purpose of this file

This document records the project context, decisions, requirements, feature interpretation, data strategy, technical direction, presentation guidance, and responsible-AI constraints discussed for the **TECHNOVA 2026** hackathon project. It intentionally excludes the detailed hour-by-hour hackathon execution plan.

---

## Project identity

**Project name:** CuraNav  
**Tagline:** Find. Compare. Navigate.  
**Working one-line pitch:** CuraNav is a government-oriented healthcare discovery platform that converts plain-language health needs into transparent hospital searches and comparisons by disease, cost, location, facilities, and data-verification status.

### Brand meaning

- **Cura** communicates care, treatment, and healthcare.
- **Nav** communicates navigation and informed choice.
- **Find. Compare. Navigate.** describes the complete citizen journey: discover relevant hospitals, compare meaningful information, and navigate to an informed next step.

---

## Hackathon context

The uploaded event presentation is **TECHNOVA 2026**, hosted by Rayat Bahra Professional University and presented by Technovate Club. The stated theme is **Responsible AI** and the listed project scope is three days, with minimum deliverables framed around a two-day build.

### Problem statement

Citizens struggle to find suitable hospitals for specific conditions because hospital information is fragmented, inconsistent, and difficult to compare. The product must surface hospital options by disease, cost, and location.

The presentation highlights these core problem areas:

- Fragmented hospital data across sources.
- Difficulty comparing costs, outcomes, and facilities.
- Limited searchable and verified hospital statistics.

---

## Required product direction

The event presentation describes a centralised government-healthcare platform that:

1. Aggregates hospital records, facilities, cost information, and outcome metrics.
2. Provides searchable data and APIs.
3. Uses AI to convert natural-language requests into structured filters.
4. Normalises information by disease, procedure codes, and location.
5. Enables transparent ranking and side-by-side comparison.
6. Emphasises transparency, data provenance, verifiability, accessibility, and responsible AI.

CuraNav should therefore be presented as a **decision-support and discovery tool**, not as a diagnostic engine, medical advisor, or universal hospital-ranking authority.

---

## Primary user problem

A citizen or family member may know the condition, a location, a budget, and a required facility, but not the right specialty or hospital. They often have to search several sources, visit hospital websites, make calls, and rely on informal recommendations before they can make a decision.

### Primary persona

A practical demo persona is:

> Harpreet needs kidney treatment near Chandigarh, has a budget below ₹2 lakh, and needs a hospital with dialysis facilities.

This persona makes the complete product flow easy to demonstrate:

1. The user enters a sentence instead of navigating medical categories.
2. CuraNav interprets the request.
3. The user sees relevant hospitals with transparent data.
4. The user compares options.
5. The user understands why the results were shown.

---

## Core user journey

### Example natural-language query

> Find kidney treatment hospitals near Chandigarh under ₹2 lakh with dialysis.

### What the system should extract

- **Condition:** Kidney disease / kidney treatment
- **Specialty:** Nephrology
- **Location:** Chandigarh
- **Budget:** Maximum ₹2,00,000
- **Facility requirement:** Dialysis
- **Preference:** Affordability first, then distance

### Structured output example

```json
{
  "condition": "kidney disease",
  "specialty": "nephrology",
  "location": "Chandigarh",
  "max_budget": 200000,
  "required_facilities": ["dialysis"],
  "sort_priority": "cost"
}
```

### Search flow

```text
Natural-language query
        ↓
Entity extraction
        ↓
Disease-to-specialty mapping
        ↓
Location, budget, and facility normalisation
        ↓
Structured database filtering
        ↓
Transparent, explainable ranking
        ↓
Hospital results and side-by-side comparison
```

---

## Mandatory MVP features

The event presentation requires the following as minimum deliverables. CuraNav should implement all of them in a clear and reliable way.

### 1. Working hospital search

Support search and filtering by:

- Disease or condition
- Specialty
- Location (city, pincode, or radius)
- Budget / maximum estimated cost
- Facilities and services

### 2. AI feature: natural language to filters

At least one AI-enabled feature is required. CuraNav's key AI feature is:

> Convert everyday-language hospital requests into structured search filters.

The AI should extract disease, location, budget, preferences, and facility needs. It should map these into controlled system values such as specialty codes, a geolocation radius, cost bands, and facility tags.

### 3. Hospital comparison view

Users should compare two or three hospitals side by side. The comparison must include at least two verifiable metrics.

Recommended comparable metrics:

- Estimated procedure cost range
- Distance from the user / selected city
- Available facilities
- Accreditation status
- PM-JAY empanelment status
- Relevant annual procedure or patient volume
- ICU bed count or specialist unit availability

### 4. Admin dashboard

An admin should be able to:

- Upload hospital data through CSV.
- Review records.
- Approve or reject records.
- Edit source, verification status, and date fields.
- Identify incomplete or suspicious records.

### 5. Data handling and labels

Use sample or synthetic data if needed, but make the status unmistakable. Each record should include a source type, verification status, and last verified date.

Suggested labels:

- **Official source**
- **Public source**
- **Verified**
- **Pending verification**
- **Simulated demo data**

Suggested visible disclaimer:

> Some statistics in this prototype are simulated for demonstration. Please confirm current costs, availability, and eligibility directly with the hospital.

---

## Product screens

CuraNav should have five main screens.

### Home / search page

Include:

- Prominent natural-language search box.
- Example query chips, such as:
  - Find heart hospitals near Delhi.
  - Kidney treatment under ₹2 lakh.
  - Cancer hospitals with chemotherapy.
- Optional structured filters.
- Location input or "Use my location" option.
- A short medical disclaimer.

### Search results page

Each hospital card should show:

- Hospital name
- City and approximate distance
- Matching specialty
- Estimated cost range
- Key facilities
- Accreditation badges
- PM-JAY / insurance status when available
- At least one relevant metric such as procedure volume
- Data-source or verification badge
- "View details" action
- "Add to compare" action

### Hospital details page

Organise information into:

- Overview: address, contact, emergency availability, map link
- Relevant specialties and procedures
- Facilities and services
- Indicative procedure cost ranges
- Accreditation and PM-JAY status
- Trust panel: source, last updated, verification status, limitations

Use transparent language such as:

- Indicative cost
- Reported data
- Simulated for prototype
- Confirm with hospital

### Comparison page

Support comparison of two or three hospitals. Present a simple side-by-side table with highlighted differences.

Example:

| Metric | Hospital A | Hospital B |
|---|---:|---:|
| Distance | 18 km | 42 km |
| Estimated cost | ₹1.2–1.8 lakh | ₹80,000–1.6 lakh |
| Relevant procedure volume | 900 | 1,240 |
| Accreditation | NABH | NABH |
| Dialysis | Yes | Yes |
| PM-JAY | Yes | Yes |
| ICU beds | 24 | 40 |

### Admin dashboard

Include:

- CSV upload component
- Hospital record table
- Pending / approved / rejected status
- Source field
- Last-updated / last-verified field
- Verification status field
- Edit, approve, and reject actions
- Basic data-quality warnings

---

## Suggested database structure

Use a relational structure where possible. The following fields are sufficient for the prototype.

```text
hospital_id
name
city
state
pincode
address
latitude
longitude
specialties[]
procedures[]
cost_min
cost_max
currency
facilities[]
accreditation[]
pmjay_empanelled
annual_procedure_volume
outcome_metric
icu_beds
source_type
verification_status
source_url
last_verified
last_updated
data_status
```

### Example facility values

- ICU
- Dialysis
- NICU
- MRI
- CT scan
- Blood bank
- Cath lab
- Emergency department
- Oncology unit
- Robotic surgery

### Suggested demo coverage

Seed roughly 20–30 hospital records across Chandigarh, Mohali, Panchkula, Ludhiana, Jalandhar, and Delhi. Cover a small controlled set of conditions:

- Kidney disease
- Heart disease
- Cancer
- Orthopaedic conditions
- Maternity / pregnancy
- Emergency care

This keeps the data believable, easier to validate, and suitable for a polished demo.

---

## Ranking approach

Do not claim that CuraNav chooses the objectively "best" hospital. Instead, say it ranks the **best matches based on the user’s stated requirements**.

### Example scoring model

```text
Final match score =
30% condition / specialty match
25% budget match
20% distance
15% facility match
10% verification confidence
```

The weights can change depending on user intent. For example:

- If the user says "cheapest" or "under ₹X," increase the budget weight.
- If the user says "nearest" or "near me," increase the distance weight.
- If the user requires a specific facility, enforce it as a hard filter or give it a high weight.

### Explainability panel

Every natural-language result should show the interpretation:

```text
We understood your request as:

Condition: Kidney disease
Specialty: Nephrology
Location: Chandigarh, within 100 km
Budget: Up to ₹2,00,000
Required facility: Dialysis
Ranking priority: Cost
```

Each result can also provide a short explanation:

```text
Why this result appears:

✓ Matches nephrology services
✓ Fits the selected budget range
✓ Has a dialysis facility
✓ Is 38 km away
✓ Has an available verification label
```

This is important for transparency and the responsible-AI theme.

---

## Responsible AI requirements

CuraNav must use AI carefully and narrowly.

### Allowed AI role

- Interpret user intent.
- Extract entities from natural language.
- Map layperson terms to structured filters.
- Help sort results according to stated preferences.

### Not allowed / should not be claimed

- Diagnosing illness.
- Recommending treatment.
- Guaranteeing hospital quality or outcomes.
- Inventing costs, bed availability, procedure volumes, or certification information.
- Claiming a hospital is universally the best.

### Guardrails

- Validate AI output against allowed specialties, locations, facility names, and budget formats.
- Display extracted filters before or alongside results.
- Use a controlled vocabulary for disease-to-specialty mapping.
- Keep all hospital statistics in the database, never generated by the model.
- Add a rule-based fallback parser for common conditions, city names, and budget phrases.
- Include a visible disclaimer that CuraNav does not provide medical advice.

### Reliable fallback behavior

If an LLM/API is slow or unavailable, use simple matching rules for terms such as:

- kidney → nephrology
- heart / chest pain → cardiology
- cancer / tumour → oncology
- bone / fracture → orthopaedics
- pregnancy → obstetrics and gynaecology
- "under ₹2 lakh" → maximum budget 200000

This protects the demo from external API or network failures.

---

## Technical stack options

### Option A — Recommended: fast, polished web product

- Frontend: Next.js + Tailwind CSS
- Backend: Next.js API routes or Node.js/Express
- Database: Hosted Supabase PostgreSQL
- Maps: Leaflet + OpenStreetMap
- AI: Gemini API or OpenAI-compatible API for NL-to-JSON extraction
- Hosting: Vercel for frontend/API and Hosted Supabase for database/authentication
- Charts: Recharts, if lightweight visual comparison is desired

**Reason:** Fast implementation, strong responsive UI, straightforward database filtering, easy deployment, and good demo quality.

### Option B — Mobile-first prototype

- Frontend: Flutter or React Native
- Backend: Firebase Firestore + Cloud Functions
- Maps: Google Maps SDK or Mapbox
- AI: Gemini API
- Hosting: Firebase Hosting, APK for demo

**Reason:** Strong for location-based mobile use, although structured comparison data can be more convenient in PostgreSQL.

### Option C — AI/data-forward architecture

- Frontend: Next.js
- Backend: Python FastAPI
- Database: PostgreSQL
- AI: LLM extraction plus a deterministic rule engine
- Hosting: Render/Fly.io for API and Vercel for frontend

**Reason:** Good for demonstrating controlled AI processing and data normalisation while keeping the system extensible.

---

## Suggested architecture

```text
                 ┌──────────────────────┐
                 │   CuraNav Web App    │
                 │ Search / Compare / UI│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     API Backend      │
                 │ Filter / Rank / Auth │
                 └────────┬──────┬──────┘
                          │      │
              ┌───────────▼──┐ ┌─▼─────────────────┐
              │ AI Intent    │ │ Hospital Database │
              │ Parser       │ │ & Verification DB │
              └──────────────┘ └────────┬──────────┘
                                         │
                                  ┌──────▼─────────┐
                                  │ Admin Dashboard│
                                  │ Upload / Review│
                                  └────────────────┘
```

### Useful API endpoints

```text
POST /api/search/natural-language
GET  /api/hospitals
GET  /api/hospitals/:id
POST /api/compare
POST /api/admin/upload
GET  /api/admin/pending
PATCH /api/admin/hospitals/:id/approve
PATCH /api/admin/hospitals/:id/reject
```

### Example search request

```json
{
  "condition": "kidney disease",
  "city": "Chandigarh",
  "max_budget": 200000,
  "facilities": ["dialysis"],
  "radius_km": 100
}
```

### Example hospital response

```json
{
  "id": "HOSP-001",
  "name": "Demo Medical College Hospital",
  "distance_km": 38,
  "cost": {
    "min": 80000,
    "max": 160000
  },
  "facilities": ["Dialysis", "ICU", "Blood Bank"],
  "accreditation": "NABH",
  "pmjay": true,
  "data_status": "synthetic_demo_data"
}
```

---

## Data strategy and provenance

The product must distinguish between official, public, and simulated data. The demonstration can use synthetic/sample records, but the user interface should never make simulated values appear officially verified.

### Record-level fields for trust

```text
source_type: official | public | synthetic
verification_status: verified | pending | simulated
last_verified: YYYY-MM-DD
source_url: optional URL/reference
```

### UI behavior

- Put a source badge on hospital cards.
- Put a detailed trust panel on hospital detail pages.
- Show last-updated/last-verified dates.
- Make synthetic-data status prominent, especially in comparison tables.
- Clarify that treatment costs are indicative and may vary with patient condition, package inclusions, doctor fees, consumables, and availability.

### Future real-data direction

The longer-term product can connect to verified government and healthcare interoperability systems, including ABDM/UHI-style provider discovery, verified hospital registries, insurance/PM-JAY information, and hospital self-service data verification workflows. The prototype should describe these as future integrations unless it actually uses live, authorised APIs.

---

## Evaluation criteria to optimise for

The presentation states that judges will evaluate:

- Functionality and stability
- AI integration and accurate, transparent extraction
- Data handling, provenance, and clear simulated-data labels
- UX and accessibility, especially a mobile-friendly interface
- Technical approach, architecture, scalability, and security considerations
- Presentation quality

### Practical consequences

- A smaller, stable workflow is better than many unfinished features.
- The AI must visibly explain its interpretation.
- Use polished empty states, errors, and loading states.
- Ensure the site works on mobile.
- Include a short architecture slide and responsible-AI slide.
- Prepare a recorded backup demo in case of internet problems.

---

## Pitch content

### Suggested title slide

**CuraNav**  
**Find. Compare. Navigate.**  
Government Healthcare Discovery & Hospital Recommendation Platform

### Problem slide

Citizens cannot easily discover and compare hospitals by condition, cost, location, facilities, and verified information because the data is fragmented and inconsistent.

### Solution slide

CuraNav centralises structured hospital information and enables citizens to search naturally, compare transparently, and understand why each result matches their requirements.

### AI slide

```text
Citizen query
        ↓
Condition + location + budget + facility extraction
        ↓
Structured filters
        ↓
Transparent hospital results
```

### MVP slide

- Disease, location, and budget search
- Natural-language query interpretation
- Facility filters
- Hospital details with data-source labels
- Side-by-side comparison
- Admin upload/review dashboard

### Responsible-AI slide

- AI interprets search intent only.
- CuraNav does not diagnose users.
- Data sources and verification dates are visible.
- Simulated data is clearly labeled.
- Results are explainable rather than black-box recommendations.

### Roadmap slide

- Multilingual and voice search
- Official data integrations
- Hospital self-verification portal
- More granular cost packages
- Outcome dashboards when reliable data is available
- Appointment/referral workflows
- Accessibility features for low-connectivity and regional-language users

---

## Suggested demonstration script

Use a clear narrative rather than describing features one by one.

> Meet Harpreet. His family needs kidney treatment near Chandigarh, with a budget below ₹2 lakh and access to dialysis. Today, he would need to check multiple websites and call hospitals. With CuraNav, he simply describes his need in one sentence.

Demonstrate:

1. Enter the natural-language request.
2. Show the extracted filters.
3. Display hospital cards and filter for dialysis.
4. Open a detail page and show the data-verification panel.
5. Add two hospitals to comparison.
6. Show cost, distance, facilities, and accreditation side by side.
7. Open the admin dashboard and show a pending record being reviewed.

Closing statement:

> CuraNav does not diagnose users or declare one hospital universally best. It helps citizens find transparent, relevant hospital matches based on their condition, budget, location, and stated needs.

---

## Likely judge questions and answers

### Are the hospital statistics real?

The prototype uses clearly labelled public, sample, or synthetic records where structured official data is unavailable. Every record includes a source type, verification status, and date. A production system would rely on authorised government integrations and verified hospital submissions.

### Can the AI provide incorrect results?

Yes, which is why AI is limited to search-intent extraction rather than diagnosis. CuraNav reveals the interpreted filters, validates them against controlled values, and has a rule-based fallback.

### How is this different from Google Maps?

Maps help users locate hospitals. CuraNav is condition-first and comparison-oriented: it maps a condition to a specialty, filters by budget and facility needs, compares hospitals side by side, and makes data provenance visible.

### How do you prevent paid ranking bias?

The ranking model is based on visible user preferences such as specialty match, budget, distance, facility availability, and verification confidence. Any future commercial relationship must not influence medical matching or be hidden from users.

### How do you protect privacy?

Collect minimal personal data, avoid storing symptoms or medical records unless necessary and consented to, do not provide diagnosis, validate all inputs, and use appropriate authentication/authorisation for the admin dashboard.

---

## Scope guardrails

Prioritise the following working features:

1. Natural-language search
2. Disease, location, and budget filtering
3. Hospital results cards
4. Hospital detail page and provenance labels
5. Side-by-side comparison
6. Admin review workflow

Avoid spending core development time on the following unless all priority features are finished:

- Full authentication system
- Live appointment booking
- Real-time bed availability
- Nationwide web scraping
- Advanced medical diagnosis
- ABHA login
- Public user reviews
- Complex outcome prediction
- Large-scale multilingual voice workflows

The winning prototype should be a complete, stable, understandable journey from citizen request to transparent hospital comparison.
