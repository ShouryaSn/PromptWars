# ProjectMatch — AI Team Builder

Describe a project in plain English, get back a ranked "dream team" pulled from a
mock candidate pool, with a written rationale for every pick.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Gemini API
(`@google/genai`, server-side only).

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `GEMINI_API_KEY` is read from
`.env` at the project root (already present, gitignored).

```bash
npm run build
```

builds cleanly with no type or lint errors.

## Flow

1. **`/` — Welcome screen.** A lightweight, decorative "sign in" (name + optional
   email). This is **not real authentication** — nothing is persisted server-side,
   no account is created. It's a mock login purely so the multi-page flow feels
   like a real product; the name is stored in `sessionStorage` and used only to
   personalize the greeting on the next screen.
2. **`/match` — The actual product.** A textarea for the free-text project
   description, an animated "AI thinking" sequence while the match runs, then a
   staggered reveal of the matched team with a "Try another project" reset.
3. **`/api/match`** — the only place that talks to Gemini. Runs server-side, so
   the API key never reaches the client.

## The two Gemini calls (`lib/gemini.ts`)

The route makes **two** sequential structured-output calls rather than one, so
each call has a narrow, well-defined job and a schema the model can reliably fill:

1. **`extractRequirements(description)`** — reads the free-text project
   description and pulls out `requiredRoles`, `requiredSkills`, and a one-line
   `projectSummary`. This turns fuzzy prose into a small structured spec.
2. **`selectTeam(description, requirements, pool)`** — given that spec plus the
   *entire* 18-person candidate pool (id, skills, interests, availability,
   experience, bio), asks the model to pick the best 3–5 people, score each
   0–100, and write one specific rationale sentence per pick, plus a one-line
   "why this team works" summary.

Splitting extraction from selection keeps each prompt focused (a single call
trying to both interpret the project *and* rank 18 candidates against it tends to
produce vaguer rationale), and lets the second call's prompt include the first
call's output as grounding context. Both calls use Gemini's `responseSchema` to
force valid JSON — the route additionally validates the response server-side
(clamps scores to 0–100, drops any `candidateId` not in the real pool) before
returning it, so a malformed model response can't corrupt the UI.

## Data

`lib/candidates.ts` — 18 hand-written mock candidates spanning engineering
(frontend/backend/ML/mobile/data/security/DevOps), design, PM, growth, and
community roles, each with skills, interests, availability, and experience level,
chosen to produce non-obvious matches rather than one-skill-per-role padding.

## Error handling

- Descriptions under 20 characters are rejected client- and server-side before
  any API call is made.
- Gemini errors/timeouts are caught in the route and returned as
  `{ error: string }` with a non-200 status; the UI shows a dedicated error state
  with a "Try again" button (retries the same description) rather than a stack
  trace.
- If the model returns zero valid picks, the route returns a 422 asking the user
  to add more detail instead of showing an empty team.

## Known limitation: free-tier Gemini quota

The Google AI Studio **free tier is capped at 20 requests/day per model**. Since
each match run costs 2 requests, that's roughly **10 full demo runs per day** on
a free key. If you see `429 RESOURCE_EXHAUSTED` in the server logs, that's why —
not an app bug. For a hackathon demo day, either enable billing on the API key
beforehand or budget your practice runs accordingly.

## File structure

```
app/
  page.tsx              welcome / mock sign-in
  match/page.tsx         the actual product (form → loading → results state machine)
  api/match/route.ts     server route, calls Gemini
  layout.tsx, template.tsx, globals.css
components/
  LoginForm.tsx, ProjectForm.tsx, LoadingSequence.tsx,
  TeamResults.tsx, TeamCard.tsx, ErrorState.tsx, BackgroundGlow.tsx
lib/
  candidates.ts          mock candidate pool
  gemini.ts               Gemini calls + schemas
  types.ts                shared response types
```
