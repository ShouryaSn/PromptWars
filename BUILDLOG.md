# ProjectMatch: AI Team Builder

***BUILD TIMELINE***

**Target:**  
Anyone who has to assemble a project team from a pool of people they only partly know hackathon organisers, student societies, internal innovation teams, and small agencies staffing a brief. The demo is framed around a client or project lead who knows what they want to build but not who is available to build it.

**What is ProjectMatch?**  
A web app that turns a free-text project description into a ranked, explained team. The user describes the project in plain prose; one Gemini call extracts the required roles, skills and constraints; a second scores every candidate in a 34-person mock pool against those requirements and returns a three-to-five-person team, each with a one-line rationale. Results render as animated cards ordered strongest-first, with the top pick flagged by a "Best match" ribbon, plus matched-skill badges, a match percentage and role filters. Each person has a full profile page with contact details.

**Why is it needed?**  
Team formation is usually done by memory and proximity, you pick the people you already know, not the people who fit. Skills, interests, availability and experience sit in scattered spreadsheets and bios that nobody reads end to end, so the non-obvious match is the one that gets missed. Reading the brief in natural language and explaining every pick makes the shortlist both faster to produce and defensible, which matters most when the window to form a team is hours rather than weeks.

## Phase 1 — Initial Build

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **1** | Recon | Checked the current state of the project directory | Baseline established | Done |
| **2** | Scope conflict | Brief said "no auth" but also asked for a login page | Resolved as mock login — name only, sessionStorage | Done |
| **3** | Environment | Node installed but absent from the session PATH | Node added to PATH permanently | Done |
| **4** | Scaffold attempt | create-next-app rejected the folder name "PromptWars" (capitals are invalid in an npm package name) | Fell back to manual scaffold | Blocked |
| **5** | Manual scaffold | Hand-created config and base files | 5 files (+107 lines) | Done |
| **6** | App shell | app/ structure, global styles, root layout | 2 files (+58 lines) | Done |
| **7** | Mock pool | Authored the seeded candidate data | lib/candidates.ts — 18 candidates (+193) | Done |
| **8** | Gemini layer | Two-call server-side integration with responseSchema-forced structured output | lib/gemini.ts, route.ts (+249) | Done |
| **9** | Entry flow | Page-transition wrapper plus welcome / mock-login page | 4 files (+162) | Done |
| **10** | Core flow UI | Project form, animated loading sequence, team cards, error state | TeamCard, TeamResults, match page | Done |
| **11** | First build | npm install and production build; audit flagged Next.js advisories | Pinned 14.2.35; Next 16 bump declined as out-of-stack | Done |

## Phase 2 — Debugging & Latency Tuning

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **12** | Stale model name | gemini-2.5-flash retired mid-build | Switched to gemini-3.6-flash | Fixed |
| **13** | Phantom submit bug | Automated form fill set the textarea DOM value without firing a React input event, so the length guard silently blocked submit | Tooling artifact, not an app bug — confirmed via real keystrokes | Resolved |
| **14** | First clean run | Full pipeline end to end with visible loading sequence | 200 OK in ~18s, correct team and rationale | Done |
| **15** | Quota exhaustion | Repeated test submissions burned the free tier (20 req/day) — 429 RESOURCE_EXHAUSTED | Documented in README; billing recommended before demo | Noted |
| **16** | Cleanup & docs | Removed debug logging, verified .gitignore, wrote README covering setup and the two Gemini calls | Clean build confirmed | Done |
| **17** | White screen | npm run build while dev server held .next corrupted the dev manifest — chunks 404'd | Cleared cache, restarted dev server, hard refresh | Fixed |
| **18** | Key rotation | New Gemini key picked up via .env hot reload | POST /api/match 200 in 47.8s | Done |
| **19** | Latency work | ~48s round trip was too slow for a live demo; capped maxOutputTokens on both calls | 29.5s — roughly 38% faster, no quality loss | Done |
| **20** | Thinking budget | Tried thinkingConfig thinkingBudget: 0 to skip extended thinking | 400 INVALID_ARGUMENT — unsupported, reverted | Reverted |

## Phase 3 — Upwork Redesign

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **21** | Empty remote | origin repo had zero commits and zero branches — nothing to restyle | User pushed master from the local session | Resolved |
| **22** | Code intake | Checked out origin/master and explored the codebase | 19 files read, structure mapped | Done |
| **23** | Design research | Reviewed Upwork's hire page for layout and colour system | Light theme spec, #14A800 green accent | Done |
| **24** | Avatars | Added randomuser.me placeholder headshots to all 18 candidates plus realistic fake contact details | candidates.ts (+122 / -12) | Done |
| **25** | Type plumbing | Carried avatarUrl through lib/types.ts and the API route | gemini.ts unaffected — it selects fields explicitly | Done |
| **26** | Navbar & chrome | New sticky Navbar, reworked BackgroundGlow, wired into root layout | 4 files (+40 / -7) | Done |
| **27** | Restyle pass | Applied the new palette across match page, LoginForm, ProjectForm, LoadingSequence | Full theme switch from dark purple to light | Done |
| **28** | Card motion | Rebuilt TeamCard with hover lift, shadow, glow ring, avatar zoom, skill-tag recolour | TeamCard.tsx | Done |
| **29** | Profile pages | New /candidate/[id] route with bio, skills, interests and a contact panel (copy-to-clipboard email) | 18 files changed overall; clean typecheck and build | Done |

## Phase 4 — GitHub Access Resolution

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **30** | Push blocked | 403 on push — no GitHub access to the repo for the organisation | Work committed locally on claude/site-layout-upwork-redesign-p6794f | Blocked |
| **31** | Diagnosis | OAuth relink alone was insufficient; the Claude GitHub App was never installed (only Cursor appeared under Installed GitHub Apps) | User installed the app with repo access | Resolved |
| **32** | Push succeeded | Redesign branch published | Branch live on GitHub | Done |
| **33** | Visual QA | Playwright plus bundled Chromium drove the dev server for screenshots — no Gemini calls made | 4 screenshots: welcome, match form, profile, hover state | Done |
| **34** | Sandbox artifact | Profile avatar rendered broken — container network policy hangs on randomuser.me, so onError never fired | Fallback-to-initials verified against a fast-failing URL | Not a bug |

## Phase 5 — UX Fixes

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **35** | Back to results | Returning from a profile reset the form instead of restoring the team | Results persisted to sessionStorage and restored on /match load; cleared on "Try another project" | Done |
| **36** | Role filter | Added pill filter chips above the results grid, computed from the roles actually present in the match, with an animated active highlight | TeamResults.tsx — only renders when more than one role is present | Done |

## Phase 6 — Demo Hardening

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **37** | Design fork | Chose between a local heuristic matcher and pre-baked cached responses for the quota fallback | Option A — local heuristic, so any typed description is covered | Decided |
| **38** | Response cache | Cache successful AI results keyed on normalised description so rehearsal replays cost no quota | route.ts plus mode / fallbackNote on the result type | Done |
| **39** | Fallback matcher | Deterministic keyword-overlap scorer with templated rationale, labelled "Offline demo match" in the UI | lib/fallbackMatch.ts | Done |
| **40** | Substring bug | Word-boundary matching applied only to terms of 3 characters or fewer, so "Unity" matched inside "community" | Boundary matching extended to all terms; false positive gone | Fixed |
| **41** | Weak recall | Prose descriptions matched zero keywords — the farming prompt missed the computer-vision candidate entirely | Domain-keyword expansion layer added | Fixed |
| **42** | Recall verified | Re-ran the offline harness against the three example prompts | Grace Kim and Ken Watanabe surface for farming; Tom Fischer and Priya Sharma for fintech; Yuki Tanaka now a genuine Unity match | Done |
| **43** | Example chips | Three one-click prompt chips (farming, fintech, multiplayer game) that fill the textarea without auto-submitting | ProjectForm.tsx | Done |
| **44** | Lint failure | useExample read as a React Hook by ESLint naming convention, breaking the build | Renamed to applyExample | Fixed |
| **45** | End-to-end check | Exercised the full route with no API key present, forcing the fallback path | Banner, chips, filter and initials fallback all verified | Done |

## Phase 7 — Landing Page & Honesty Polish

| # | Milestone | What happened | Output | Status |
| :-: | :-: | :-: | :-: | :-: |
| **46** | How it works | Three step cards (Describe → AI reads between the lines → Meet your team) with hover lift and icon scale; copy surfaces the two-pass architecture | Landing page section | Done |
| **47** | Stats band | Four tiles with animated count-up: 12,847 professionals, 3,214 projects matched, 94% would rematch, under 60s to a shortlist | Marketing figures, not the real 18-person pool | Done |
| **48** | Footer disclaimer | Explicit note that profiles, contact details and stats are illustrative demo content | Consistent with the "Demo mode" login label | Done |
| **49** | Chip honesty fix | Generalist backfill picks previously showed accent-coloured skill pills that contradicted the "no direct match" rationale | skillsMatched flag wired through both AI and fallback paths; dashed grey chips with a caption | Done |
| **50** | Screenshot artifact | Playwright fullPage capture rendered the new scroll-triggered sections blank | IntersectionObserver quirk in that capture mode — verified correct under real scrolling | Not a bug |
| **51** | Pool expansion | Grew the candidate pool from 18 to 34 so every one of the 17 roles has two people, each differentiated in stack and focus from its counterpart — Carlos Mendez on Vue/Django/MongoDB against Maya Chen on React/Node/Postgres/GraphQL, Marco Silva on Unreal/C++ against Yuki Tanaka on Unity/C# | candidates.ts; verified no duplicate IDs, avatars, emails or phone numbers across all 34 | Done |
| **52** | Best-match highlight | Results were already sorted by suitability, so the top-scoring pick now carries an amber outline, glow ring and a "Best match" ribbon; computed from the full team so the badge does not move as role filters change, and genuine ties are all highlighted rather than one picked arbitrarily | TeamResults.tsx (+10 / -1), TeamCard.tsx (+24 / -3) | Done |
| **53** | Verification | Clean typecheck and production build; badge, new candidate profiles and the existing fallback banner and chip distinction confirmed together at desktop and mobile widths | Zero Gemini calls — no key present in the sandbox | Done |
| **54** | Avatar marquee | New AvatarMarquee component drifts a shuffled sample of ~16 candidates in a seamless loop (a sample rather than all 34 doubled, to keep image requests down for a thin decorative strip); hover pauses the drift, hovering an avatar shows a name and role tooltip | components/AvatarMarquee.tsx, placed as a thin band between the hero and "How it works"; reuses the existing initials fallback | Done |
| **55** | Cursor parallax | BackgroundGlow became a client component that nudges the two blurred blobs up to ~25px toward the cursor using framer-motion springs; deliberately subtle ambient depth, not a spotlight, and skips the listener entirely under prefers-reduced-motion | Applied site-wide for consistency rather than scoped to the landing page | Done |
| **56** | Avatar URL audit | Confirmed all 34 avatar URLs are present, unique and well-formed with indices in the valid range; direct fetch and real <img> loads were both blocked by the sandbox network policy, so live rendering could not be confirmed from here | Data integrity verified; live check deferred to a local run — the onError initials fallback covers any failure regardless | Partial |
| **57** | Parallax diagnosis | Effect appeared to stop working. An 18-second continuous mouse-movement test showed no degradation, ruling out the mechanism; the cause was architectural — BackgroundGlow was mounted separately in /, /match and the profile page, so client-side navigation unmounted and remounted it, snapping the blobs back to neutral | Transform confirmed resetting to matrix(1,0,0,1,-288,0) the instant /match loaded | Diagnosed |
| **58** | Parallax fix | Moved BackgroundGlow into the root layout so it mounts once per session, and removed the three duplicate per-page instances | Re-ran the navigation test — reset gone, effect persists across client-side navigation; a hard reload still resets, as expected for in-page state | Fixed |
| **59** | Sign up / Log in | Added a mode toggle on the entry screen using the same sliding-pill pattern as the role filter chips. Sign up keeps Name plus optional Email; Log in takes Email and Password, derives a display name from the address, and does not check the password since there is still no backend | LoginForm.tsx plus switcher links and an updated demo-mode disclaimer covering the password field | Done |
| **60** | Auth flow QA | Verified both modes render, invalid email is caught by native validation with custom validation as backup, and an empty password shows an inline error. One screenshot initially clicked the toggle instead of submit because both buttons read "Log in" — selector fixed and the check redone | Zero Gemini calls; login derives "Ada Lovelace" from ada.lovelace@example.com on /match | Done |
| **61** | Repo sync | Confirmed the working tree is clean and local HEAD matches origin at 6395fe8 with a zero diff | All 9 session commits live on claude/site-layout-upwork-redesign-p6794f | Done |
| **62** | Deployment | Source published to GitHub and the app deployed to Vercel from that repository, giving a live hosted build rather than a localhost-only demo | Live on Vercel; code on github.com/ShouryaSn/PromptWars | Done |