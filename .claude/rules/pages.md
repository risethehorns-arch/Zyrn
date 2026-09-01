---
paths:
  - "*.html"
  - "services/*.html"
---

# ZYRN — the pages, and why each one is the way it is

Moved out of CLAUDE.md on 2026-08-30: this is per-page rationale, and it
is only worth loading when a page is actually being worked on. It loads
automatically whenever Claude touches an .html file in this repo.
The always-loaded index of these pages is in CLAUDE.md.

## Layout

```
index.html              live landing page — plain HTML/CSS/JS, no build step
                        five scenes: SYS.01 hero · SYS.02 capability · SYS.03 service
                        lines · SYS.04 readiness index · SYS.05 access. Capped at five
                        deliberately — see docs/strategy.md §4. It OPENS on the
                        torus (S3 CORE) because the hero lede is "Zyrn builds the
                        operating core" — then S3 → S1 (the core opens into four
                        arms, one per line, as SYS.03 arrives) → S3 (SYS.04's
                        ladder climbs from emergent back to engineered) → S4.
                        Also carries the section index rail and the stats strip.
assets/js/field.js      SYS.07 — THE BED, on every page. A 90k-point GPGPU particle
                        simulation; there is no asset behind it. One shared engine,
                        per-page `program` (which formations, at which scroll
                        positions) and `channel` (tilt + spin), so moving between
                        pages reads as one instrument changing channels.
                        Spec: docs/spec-presence-field.md.
                        Capture flags — headless verification only works with these,
                        because a real-time sim is still mid-flight when a headless
                        screenshot lands: ?freeze=S1|S2|S3|S4 · ?p=0.28 · ?probe=1 ·
                        ?nogl=1 · ?particles=N · ?coarse=1 · ?debug
assets/css/field.css    the page layer for the field: mounts the canvas, enforces
                        Departure 4 site-wide, adds the stats strip and flat fallback.
foundation.html         SYS.00 — what the firm is, the mission, who it is for, and
                        the founder. Its motion is deliberately quieter than the
                        service instruments: the mark's own language (a shear on
                        the founder's name, one Pulse slice across the credential
                        row) and nothing that pins the scroll.
                        The founder is Yazan Tarawneh, set in the shear
                        component — both .shear__half spans must carry identical
                        text or the clip-and-offset breaks. Carries JSON-LD
                        Organization + founder.
services.html           SYS.03 — the index for the four lines, and the nav slot
                        `Brand` used to hold. It has to belong to both
                        neighbours: the landing page's scene rhythm above it,
                        the service pages' hero/tabs/footer below it. Carries
                        its own signature instrument (THE CORE), the four
                        lines as full rows, and the combination matrix.
                        Field program S3 → S1 → S1 → S3: one system, opened
                        into four, recombined. It lives at the ROOT, not at
                        services/index.html, because `routeFor()` keys on the
                        last path segment and a directory URL yields '' —
                        which is already the landing page's key.
brand.html              SYS.06 — HOW WE PRESENT A BRAND KIT. Rewritten 2026-08-19
                        at the owner's direction: it used to document Zyrn's
                        OWN brand, which is inward-facing and makes no argument
                        to a buyer. It now covers the deliverable generally —
                        four properties, seven parts, the handover — with a
                        worked example that is deliberately NOT Zyrn: Lumina's
                        palette, type, mark, motion and layout, in vitrines.
                        Still a document rather than an experience (legibility,
                        not atmosphere), and still reachable from the footer's
                        "The firm" column, labelled "Brand kit — the method" so
                        it cannot be confused with the SERVICE line of the same
                        name two columns over.
                        The previous page survives in two places, and NOT in
                        the repo working tree: `_archive/` is gitignored, so
                        the local copy at
                        _archive/brand-zyrn-doctrine-v2.html exists on this
                        machine only. In a fresh clone, recover it with
                        `git show 59ace3c:brand.html`. Either way nothing was
                        lost — Zyrn's own doctrine is operative in THIS file,
                        which is where it was always enforced from.
axes.html               SYS.09 — AXES, our own assistant module, IN
                        SERVICE. It runs on Claude Opus 5 and it is the
                        thing that built this site, which is the whole
                        argument of the page and the reason it can be
                        evidenced rather than described: §04 is a ledger
                        of numbers counted out of THIS repository at the
                        moment the page was written.
                        It is deliberately NOT the same object as Duk.
                        Duk is the open one, built for a client's own
                        operating core and given away; Axes is the one
                        the firm runs in order to build things, and the
                        soft ask in §06 is for a module of your own
                        through line 04 — not for Axes.
                        Identity: the plural of axis — the directions a
                        problem can be worked along. The mark is three
                        axes crossing at one origin inside the hexagon
                        they describe, and it must stay that way: v1 drew
                        them as RAYS inside a dashed circle and at card
                        size that is a CLOCK. An axis extends both ways.
                        No new hue, same as Duk. §02 states the METHOD
                        rather than an incident: the question each of the
                        six axes opens, why the answer is rarely on the
                        axis the brief pointed at, and what comes back —
                        as a READABLE grid rather than as a pinned
                        instrument. It was a pinned instrument until
                        2026-08-21; see `.claude/rules/instruments.md` for why
                        that was removed and what it cost.
duk.html                SYS.08 — DUK, our own open-source agent, IN
                        DEVELOPMENT. It is NOT released, and the page is
                        written to hold that line: status chip in the hero,
                        a §06 that says plainly there is no public build, no
                        launch date, no waiting-list counter. Ambition about
                        DESIGN INTENT is fine and deliberate; claims about
                        adoption, benchmarks or dates are not, and none are
                        made. **The one soft number is the five-pip progress
                        bar in §06, set to 2/5 — the owner should confirm or
                        change it.**
                        Identity: named for the rubber duck (explain the
                        problem out loud and you find it yourself), and the
                        whole product thesis is "it asks before it answers".
                        The mark is a listening aperture, three arcs turning
                        at different rates — deliberately NOT a picture of a
                        duck. No new hue: Duk is ours, so it takes Obsidian,
                        Vapor and mono like everything else, and gets its
                        energy from motion. Its instrument is THE
                        INTERROGATION — see `.claude/rules/instruments.md`.
lumina.html             SYS.07 — CASE 01. The site's first and only piece of
                        proof. Lumina (private real-estate advisory, Amman) is
                        a Zyrn client; this is their brand kit and website, and
                        the fact that the whole palette was later replaced
                        without a component being rebuilt. Root level, not
                        work/lumina.html — `routeFor()` keys on the last path
                        segment. Two instruments — `.claude/rules/instruments.md`.
services/*.html         four service pages, one per line, in this order:
                        01 website-design · 02 brand-kit · 03 business-structuring
                        · 04 ai-transformation ("AI adoption & transformation").
                        Generated from ONE template — keep them in sync; edit all
                        four or none. Each carries the same field + grid, plus its
                        own SIGNATURE INSTRUMENT — `.claude/rules/instruments.md`.
                        Human capital and Web & strategy were retired 2026-08-18
                        at the owner's direction; both are in
                        _archive/retired-services/ and can be restored as a fifth
                        and sixth line without rework.
assets/js/modules/      the signature instruments, one per service page:
                        _track.js    shared rAF scroll-progress plumbing
                        build.js     01 — a surface assembling itself, five stages
                        specimen.js  02 — the brand kit, operable
                        graph.js     03 — decision rights, rewired on scroll
                        readiness.js 04 — the index climbing 00 to 04
                    core.js      services.html — the set's own instrument
                    matrix.js    services.html — the combination matrix
                    rack.js      lumina.html — two device frames with the real
                                 Lumina site scrolling inside them, at
                                 different rates
                    rebase.js    lumina.html — nine real tokens moving between
                                 two real palettes, interpolated in OKLab
                    interrogate.js
                                 duk.html — twenty-two candidate causes cut
                                 down to one constraint by four questions
                    (decompose.js was axes.html's pinned instrument and
                                 was REMOVED 2026-08-21 — see `.claude/rules/instruments.md`. Its
                                 replacement is assets/js/axsplit.js, which
                                 is not a scroll instrument at all)
assets/css/svc-modules.css
                        styling for all four instruments.
assets/css/styles.css   all styling, tokens at :root (incl. the glass + glitch systems)
assets/css/brand.css    brand-page-only document layout
assets/css/service.css  service-page layer (hero, module cards, phases, signals)
assets/css/services.css services.html only — the core diagram, the line rows
                        and their four glyphs, the matrix
assets/css/case.css     lumina.html — the case layout, both instruments, and
                        THE VITRINE (see doctrine below)
assets/css/proof.css    index.html only — the "In production" band. Split
                        out of case.css so the landing page does not pull two
                        pinned instruments and Lumina's two typefaces to
                        style two cards
assets/css/duk.css      Duk's mark and page. Loaded on duk.html AND on
                        index.html, because the band carries the live mark
                        and nothing else should own that component
assets/css/axes.css     Axes' mark, its landing-band panel, its page and
                        the decomposition. Loaded on axes.html AND on
                        index.html, same arrangement as duk.css
assets/js/axsplit.js    THE SPLITTER — the moving picture in axes.html §02.
                        One brief opens into six parallel streams and
                        resolves into one artefact, on a loop. It reads
                        NOTHING about the page — not scroll, not viewport
                        height, not any other element — and draws inside a
                        box it is given by `aspect-ratio` in normal flow.
                        That is deliberate: it replaced a pinned instrument
                        whose every defect came from measuring the page.
assets/js/axent.js      THE AXES ENTITY — the panel on the Axes card, index.html
                        only. A 2D-canvas particle entity, ~330 circular points,
                        cycling core → six arms → ring on a 14s loop. It is the
                        card's cover BECAUSE Axes has no interface to photograph:
                        a module has no window, and an invented screenshot of a
                        product that is running right now is the one lie this
                        site cannot afford. Deliberately NOT WebGL — the landing
                        page already spends its GPU on a 90k-point field, and a
                        second context for a 385x240 panel is not worth a card.
                        Parks on IntersectionObserver, one still frame under
                        reduced motion, `pointer-events:none` so the card stays
                        one hit target.
assets/js/cmdk.js       THE INDEX (⌘K) — on every page. See below.
assets/css/cmdk.css     its housing
assets/js/ui.js         shared on every page: irregular glitch scheduling + page
                        transition veil
assets/js/main.js       DOM runtime (hero shear · readout rail · reveals)
                        — dt-based smoothing (k=5/s ≡ spec's 0.08@60Hz). The video
                        scrub, frame cache and decoder handling that used to live
                        here are GONE with the bed; this file no longer touches a
                        canvas or a video element.
                        NEVER pass desynchronized:true to getContext anywhere in
                        this project — it hard-froze the renderer on this machine.
assets/media/           icons, the share card, the Lumina mark.
assets/media/work/      the case-study captures — five stitched strips of the
                        LIVE www.lumina-jo.com (hero, room, invest, listings,
                        services) plus a mobile strip and the landing-page
                        card. Taken at 2x/3x and finished with a light
                        contrast/saturation/unsharp pass so they survive
                        being scaled into a device frame; the first pass was
                        noticeably soft. ~1MB total, all lazy but the first.
                        Rebuild with the capture scripts, not by hand — the
                        instrument strips depend on the measured pinned-track
                        ranges, and the flat ones on hiding fixed elements so
                        the nav does not repeat once per band.
design/                 source of record from Claude Design (.dc.html) — reference only, never served
docs/build-spec.md      the authored brief (v1.0 — written for the video bed)
docs/spec-presence-field.md
                        the field's spec: formations, physics, the three departures,
                        performance budget, acceptance list
docs/strategy.md        positioning research, where each finding landed, and the
                        sourced third-party stats awaiting sign-off before going public
```

**Steel is a panel colour.** `#767E8C` disappears against the open field — mono
metadata sitting directly on it takes Vapor at 0.6–0.9 alpha plus the veil shadow
instead. Steel is correct inside panels, where the obsidian veil backs it. This
still bites: `.lockup__live` and `.stats__l` are Vapor for exactly this reason.

**Do not nest a `[data-reveal]` inside another one.** The parent's reveal
clip-path is `inset(0 0 18% 0)`, which hides the bottom band of its own box — a
nested observer target sitting in that band never registers as visible and never
reveals. Let children inherit the parent's reveal instead.

`design/*.dc.html` is Claude Design's own format (`<x-dc>`, `DCLogic`) and does not
run standalone. `index.html` is the faithful vanilla port and is the thing we build on.

## `services/crm.html` — the fifth channel (added 2026-09-01)

The customizable CRM. Not line 05: see `docs/decisions.md`. Generated from
the shape of `services/ai-transformation.html` by a script rather than
hand-authored, so the head, the nav, the footer and the script scaffolding
are the same on all five and a change to any of those still lands here.

**Everything it prints about the product is counted or quoted, not
asserted.** The build numbers (81 source files, 8,996 lines, 16 screens,
09 action modules, 07 endpoints, 20 declared types carrying 130 typed
fields, 08 runtime dependencies) were counted out of the Lumina Desk
repository. The four guarantees on the prism's fourth face are the four
that `website-sync.ts` actually enforces — archive rather than delete, desk
photos surviving a sync, a one-way feed, and desk-created records the feed
never touches. If the product changes, these have to be re-counted; if you
cannot re-count one, it comes off the page rather than going stale.

The instrument is **THE PRISM** (`modules/prism.js`).
