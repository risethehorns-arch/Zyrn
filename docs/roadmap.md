# ZYRN — the next four phases

`SYS.00 — Roadmap / V.1.0` · compiled 2026-08-30

Continues `docs/strategy.md` (compiled 2026-08-16). That document sourced the
positioning; this one sources what to build next and divides it into four
phases that each ship on their own.

**Constraint on every phase, owner-set 2026-08-30:** the design, the colours,
the field, the motion and the interactions are kept. Nothing here changes an
established surface. Everything here is addition, evidence, or optimisation of
what already runs.

---

## 1. What changed in the market since 16 August

### 1.1 Build-vs-buy flipped, and that is the whole opening

The strategy note argued that Zyrn's competitor is a management consultancy
that leaves after the deck. That is still true. What has changed is the cost of
the thing Zyrn leaves behind.

35% of enterprises have already replaced at least one SaaS tool with software
they built, and 78% plan to build more during 2026. Agentic coding collapsed
the time to build internal tools, integration glue and admin surfaces — a
two-person team now scaffolds a custom replacement in days.

This lands directly on the brand's existing sentence — *"Zyrn doesn't advise
from the outside. It installs the system and stays until it runs."* Installing
used to be the expensive half of that claim. It is now the cheap half. The
sentence was written before the market caught up with it.

### 1.2 The customizable CRM sits exactly in the gap

The published advice is consistent: below roughly 15–20 seats, a custom CRM
does not pay, because a custom CRM costs $150,000–$500,000 with 15–25% annual
maintenance. HubSpot Professional runs ~$38,040/yr for 25 seats; Salesforce
Enterprise ~$49,500/yr.

That advice prices the OLD build. Lumina's Sales Desk is one HTML file, a
Supabase project, and no build step. The whole category of firm that the
published math excludes — too small to fund a build, too specific to fit
HubSpot — is the wedge, and it is not a small category:

- MENA technology spend reaches **$169bn in 2026** (Gartner).
- The Middle East CRM market is ~**$3.9bn**; the Gulf holds ~42%.
- The MEA SME sector is growing ~**10% a year**.
- Typical regional CRM implementation runs **$50,000–$200,000**, which most
  regional SMEs cannot allocate — the stated reason adoption stalls there.

Zyrn already has the artefact, built for a real brokerage, with a real book
behind it. It is the most literal possible proof of "installed, not advised",
and the site does not mention it.

### 1.3 What converts on a B2B surface in 2026

- The average B2B site converts **2–4%** of visitors to leads.
- **41%** of B2B buyers now run a detailed ROI analysis, so case pages that
  convert open with numbers and no preamble.
- Social proof works **contextually throughout** a site — logos on the home
  page, the relevant case on each service page — not gathered into one band.
- What separated high-performing builds from average ones was not visual
  design but information architecture and conversion structure.

Measured against that, the current site has **one conversion path** — a
`mailto:` — and proof in **exactly one band**. Every other surface is a claim.

### 1.4 Immersion: the bar moved from looking to responding

- 2026 award winners "feel interactive"; visual craftsmanship is table stakes.
- **Restraint is the trend**, not the exception — the site is already there.
- **Adaptive pacing**: fast scrolling abbreviates transitions, slow scrolling
  reveals detail. Judges are explicitly rewarding narrative pacing.
- CSS scroll-driven animations reached ~85% support (Safari 26); View
  Transitions and Speculation Rules are mature enough to replace most of what
  teams use JS animation libraries for.
- Only **48%** of mobile origins pass all three Core Web Vitals. INP is good on
  **77%** of mobile against **97%** of desktop — the gap is main-thread JS.

The design does not need to change to move on any of these. The main thread
does.

---

## 2. What the audit found (counted 2026-08-30)

| | |
|---|---|
| Pages | 11 |
| Own CSS | 8 files, 120KB raw / **30KB gzipped** |
| Own JS | 8 files, 118KB raw / **38KB gzipped** |
| three.js, from jsdelivr | **110KB gzipped**, third-party origin |
| Field, measured | 2.78ms median, p95 3.87ms, governor rung 0 |
| Cold start | 2.5s |
| Conversion paths, site-wide | **01** (`mailto:`) |

Five things worth acting on:

1. **The signature instrument depends on a third-party origin.** All 11 pages
   `await import('three')` from jsdelivr. It degrades gracefully — `boot()` is
   caught and `flat()` runs — but a degraded page is a page with no Zyrn on it.
2. **The import graph is a waterfall.** Three modules are preloaded;
   `RenderPass`, `UnrealBloomPass` (which pulls `LuminosityHighPassShader` and
   `CopyShader`) and `OutputPass` (which pulls `OutputShader`) are discovered
   only when `field.js` executes — three round trips deep, on a third-party
   host. This is most of the 2.5s cold start.
3. **`index.html` loads 41KB of CSS for two thumbnails.** `axes.css` (26KB) and
   `duk.css` (15KB) are pulled in whole for the `.axfield` and `.dukmark`
   marks in the proof band.
4. **The fonts are render-blocking and third-party.** Lumina self-hosts three
   faces. Zyrn self-hosts none.
5. **`V.2.0 / EN — AR` prints on all 11 pages and there is no Arabic.** Same
   class of defect as Duk's invented progress bar and the three `href="#"`
   links removed on 2026-08-21: a claim with nothing behind it. Ship the
   surface or drop the line.

The field measurement is what makes Phase 1 affordable: at 2.78ms the page is
using 17% of a 60Hz frame. There is room for a video.

---

## PHASE 1 — Lumina, in motion

*The strongest asset on the site is a still.*

The Lumina card is `lumina-card.webp`, and `lumina.html`'s rack steps through
five stitched captures. Both are pictures of a site whose whole argument is
that it moves — `/room` and `/invest` are pinned scroll instruments with
measured 4,140px and 3,420px tracks.

- Capture the live `www.lumina-jo.com` over CDP screencast at 1440×900 DPR2 —
  hero, the room furnisher, the investment build, listings, services. Real
  motion, one load, forward scroll only (scrolling back replays entry
  animations and froze the hero mid-wipe last time).
- Encode two loops: a 6–8s card loop and a longer reel for the case page.
  AV1/WebM with an H.264 MP4 fallback, `poster` = the existing webp.
- Wire it `muted loop playsinline preload="none"`, played by
  IntersectionObserver, poster-only under `prefers-reduced-motion`, and
  `pointer-events:none` so the card stays one hit target.
- Upgrade `lumina.html`'s `.rk` desktop frame to the reel, keeping the
  scroll-bound caption, index and percent readout — the same instrument, with
  real footage in the window.
- The vitrine rule still binds: another firm's surface is shown inside a
  bounded frame with a mono caption, never adopted.

**Gate:** the card video must not move the field's 2.78ms median or the 2.5s
cold start. Measured with `gpuprobe.py` before and after.

---

## PHASE 2 — The Sales Desk: a customizable CRM, sold

*Zyrn has a product and the site does not mention it.*

**Positioning: not a fifth line.** "Four lines. One system." is the H1 of
`services.html`, a kinetic headline, a signature instrument that draws four
diagonals, and the meta description on two pages. The CRM is not a fifth line —
it is what the lines *ship*. It gets its own tier: **SYSTEMS**, the artefact of
"installed, not advised".

- New page for the customizable CRM, argued the way this site argues. The three
  rules that are actually the sales pitch, because they are what a broker
  fears: **an empty cell never clears a value**, **a ref that vanishes is
  flagged, not deleted**, and **provenance is enforced in the database, not the
  browser**.
- Every number counted from the repo, none asserted: one HTML file at **1,277
  lines**; **06** SQL migrations, 596 lines; a **156-line** test suite run
  against the real **129-record** book (121 rentals, 5 sales, 3 either); a
  **07-day** follow-up SLA; row-level security; no build step; deploys to any
  static host.
- The in-production band goes to four cards. `proof.css` is an explicit
  three-column grid (not `auto-fit`, deliberately) — four across at 1440 is too
  thin, so this is a 2×2 above 1040 and a stack below 640.
- **Status must be true on the day it ships.** The SQL is reconstructed and
  unapplied. The card reads what is actually the case, not "Live".
- Nav, footer, `services.html` and the JSON-LD move together.

**Gate:** this adds height to `index.html`, which re-anchors the field program
(CLAUDE.md hard rule). Re-measure the section centres at 1440×900 and 390×844
and take the mean. Do not nudge by eye.

---

## PHASE 3 — The Readiness Index becomes an instrument

*One conversion path, site-wide, is the selling gap.*

`docs/strategy.md` §5.2 already called this: *"the index is a product, not a
section… the natural lead magnet, and it is on-doctrine because it produces a
number."* Two weeks of market reading has not produced a better candidate.

- SYS.04 is currently a ladder you read. Make it a short self-scored assessment
  across the five dimensions already named — strategy, workforce, workflow,
  governance, data — returning a rung **00–04** and a one-page read.
- On-doctrine by construction: it outputs a counted number, which is doctrine
  rule 2 exactly, and it makes the exit condition — *"the organization tunes
  itself. Zyrn is no longer required"* — operational rather than rhetorical.
- Built in the site's existing language: the ladder animates to the scored
  rung, the field answers it, the result is a mono readout. Not a modal, not a
  progress bar, not a gate.
- It captures a qualified lead **with a number attached**, which is what makes
  a four-seat referral-only intake defensible instead of decorative.
- Static-site constraint: no server. Either score entirely client-side and hand
  over by mail, or one serverless function. Decided at phase start.
- Same phase: contextual proof. `services/website-design.html` and
  `services/brand-kit.html` are the two lines Lumina evidences and neither
  links to the case — CLAUDE.md's own open item.

---

## PHASE 4 — One instrument, eleven pages

*Make it feel like a complete website rather than eleven pages sharing a
background.*

Nothing here is visible as a design change. All of it is felt.

- **Cross-document View Transitions + Speculation Rules prerender.** The field
  already hands off between pages; view transitions make that handoff visible
  and prerender puts the next page's LCP in low milliseconds. Largest available
  immersion gain, zero design change.
- **Self-host three.js and the six addons, and preload the whole graph.**
  Removes a third-party origin from the signature instrument and kills the
  three-deep waterfall. Expected to take most of the 2.5s cold start —
  measured, not assumed.
- **Self-host Space Grotesk and IBM Plex Mono**, woff2, subset to the glyphs
  the site actually uses. Removes two preconnects and a render-blocking
  third-party stylesheet.
- **Extract the proof-card marks** out of `axes.css` and `duk.css` so
  `index.html` stops loading 41KB for two thumbnails.
- **Move eligible scroll work from rAF to native CSS scroll-driven animation**,
  with `_track.js` as the fallback. This is the INP work, and INP is where the
  77%-mobile / 97%-desktop gap lives.
- **Adaptive pacing** — a scroll-velocity threshold in `_track.js`: fast
  scrolling abbreviates, slow scrolling reveals. The 2026 award pattern, and it
  costs one number.
- **Arabic, or stop claiming it.** Amman and the Gulf are the buyers. Ship an
  RTL surface or delete `EN — AR` from all 11 footers.
- **A real contact surface** instead of a `mailto:`, and the privacy page a
  firm that collects assessment answers needs to have.

---

## Ordering and dependencies

Phases 1 and 2 are owner-requested and independent of each other. Phase 3
changes revenue. Phase 4 makes it feel finished.

One hard dependency: **Phase 2 changes `index.html`'s height and therefore
re-anchors the field program.** It must not run concurrently with anything else
touching `index.html`.

Each phase closes the way every phase on this project closes — measured,
verified locally at 393×610, 1440×900 and 2530×500, then pushed on the owner's
word.

---

## Sources

- [Build vs Buy: The 2026 Case for Custom AI Tools — Digital Applied](https://www.digitalapplied.com/blog/build-vs-buy-ai-custom-tools-vs-branded-saas-2026)
- [Buy vs Build Just Flipped — paddo.dev](https://paddo.dev/blog/buy-vs-build-flipped/)
- [Build vs. Buy CRM in 2026: The True Cost Comparison — Salesforce](https://www.salesforce.com/blog/build-vs-buy-crm/)
- [Custom CRM vs Salesforce vs HubSpot (2026): The Real Math — Codebrand](https://www.codebrand.us/blog/custom-crm-vs-salesforce-hubspot-2026/)
- [Custom CRM vs Salesforce: 2026 SME Cost Guide — Datasoft](https://datasofttechnologies.com/blogs/custom-crm-vs-salesforce-which-fits-your-sme-in-2026)
- [GCC CRM Market 2026–34 — IMARC](https://www.imarcgroup.com/gcc-customer-relationship-management-Market)
- [Middle East CRM Market — Ken Research](https://www.kenresearch.com/middle-east-customer-relationship-management-crm-market)
- [Middle East Digital Transformation Market Forecasts — Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/middle-east-digital-transformation-market)
- [CRM Middle East 2026: Buyer's Guide — Codleo](https://www.codleo.com/blog/best-crm-middle-east)
- [Best practices for a high-performing B2B website in 2026 — Grafit](https://www.grafit.agency/blog/best-practices-for-building-a-high-performing-b2b-website-in-2026)
- [How to turn B2B case studies into high converting pages — Grafit](https://www.grafit.agency/blog/b2b-case-studies-that-convert)
- [Why Are Immersive Experiences Dominating the 2026 Awwwards? — Digital Strategy Force](https://digitalstrategyforce.com/journal/why-are-immersive-experiences-dominating-the-2026-awwwards/)
- [Immersive Storytelling Websites: The 2026 Guide — Utsubo](https://www.utsubo.com/blog/immersive-storytelling-websites-guide)
- [Scroll-Driven Animations and View Transitions — Mintec](https://mintec.co/blog/scroll-driven-view-transitions-css-2026/)
- [State of Web Animation 2026 — Annnimate](https://annnimate.com/state-of-web-animation)
- [Core Web Vitals 2026: INP, LCP, CLS — Senorit](https://senorit.de/en/blog/core-web-vitals-2026)
