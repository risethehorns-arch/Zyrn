/* ══════════════════════════════════════════════════════════════════════
   SIGNATURE · THE RE-BASE   (lumina.html)

   Six weeks after Lumina's kit shipped, the client asked for a different
   palette. Not an adjustment — a different one. Every ground, every
   accent, every hairline.

   That request is the whole argument for building a brand as tokens
   rather than as pictures, so this instrument performs it: scroll, and
   the palette actually changes. Nine swatches move from the set that
   shipped on 2026-07-14 to the set that replaced it on 2026-07-28, and a
   live specimen of Lumina's own card re-tints underneath them. Nothing
   here is a picture of a colour change. The specimen is real markup
   reading real custom properties, which is the point being made.

   THE INTERPOLATION IS OKLab, NOT sRGB, and that is not decoration.
   The headline move is gold #D6BF9E -> #FFB25A, a hue rotation as well as
   a saturation jump. Lerping those channel-wise in sRGB routes the
   midpoint through a dead khaki that was never in either palette and
   reads as a bug. OKLab is perceptually uniform, so the midpoint is a
   colour a designer would actually recognise as "between these two".

   Every hex printed on screen is computed from the same interpolation
   that paints the swatch, so the readout cannot drift from the colour.
   ══════════════════════════════════════════════════════════════════════ */

import { onTrack, swapText, pad3, REDUCED } from './_track.js';

/* The two sets, verbatim from the Lumina repo's own token table. `to`
   values are what ships today; `from` is the set recorded there as
   "previous set, for reference if a revert is ever wanted". Plinth has no
   `from` — it did not exist before the re-base, it was added by it. */
const TOKENS = [
  { name: '--ink',     use: 'page base',        from: '#060C18', to: '#05070B' },
  { name: '--navy',    use: 'brand base',       from: '#0E1729', to: '#0B1018' },
  { name: '--navy-2',  use: 'raised surface',   from: '#16223A', to: '#121A24' },
  { name: '--navy-3',  use: 'raised surface',   from: '#1E2C48', to: '#1A2431' },
  { name: '--cream',   use: 'text',             from: '#F6F1E7', to: '#F7F2E9' },
  { name: '--gold',    use: 'accent',           from: '#D6BF9E', to: '#FFB25A' },
  { name: '--gold-lt', use: 'glow highlight',   from: '#FAE5C8', to: '#FFE0B0' },
  { name: '--gold-dp', use: 'hairline',         from: '#9C8259', to: '#C07F3E' },
  { name: '--plinth',  use: 'hero plinth',      from: null,      to: '#7FD9E8' },
];

const NOTES = [
  'The set that shipped. Eight tokens, one stylesheet, and every component on fourteen pages reading from them rather than carrying colour of its own.',
  'Six weeks in, the client asked for a different palette — not a tint, a replacement. On a kit built as pictures this is where the rebuild starts.',
  'It is a sweep instead. One file changes. Grounds go deeper, the accent turns from soft sand to a real amber, and the hairline follows it.',
  'A colour that did not exist before: the cyan plinth under the hero. The kit gained a token rather than growing an exception.',
  'Nine tokens, eight replaced and one added, in a single commit. Components rebuilt: none. That is the only thing a brand kit is actually for.',
];

/* Stage boundaries. Retimed 2026-08-19: the first pass ran the sweep from
   0.22 to 0.76 of a 400vh track, which left 22% of dead scroll before
   anything moved and 24% after everything had. On a 4-screen track that is
   roughly 1800px of scrolling with nothing happening, and it read exactly
   as reported — "barely anything changing, then it goes to the one below".
   The track is 320vh now and the sweep occupies 0.05 to 0.86. */
const CUTS = [0.10, 0.24, 0.62, 0.82];

/* first token starts here, each subsequent one this much later, each
   taking this long — last token lands at 0.05 + 8*0.065 + 0.29 = 0.86 */
const T0 = 0.05, STEP = 0.065, SPAN = 0.29;

/* ── colour ──────────────────────────────────────────────────────────
   sRGB hex -> OKLab -> hex. The matrices are Björn Ottosson's. */

const hex2rgb = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrg = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function oklab(hex) {
  const [R, G, B] = hex2rgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function unlab(L, A, B) {
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.2914855480 * B, 3);
  const v = [
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((c) => Math.round(Math.min(1, Math.max(0, toSrg(c))) * 255));
  return '#' + v.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const mixHex = (a, b, t) => {
  const A = oklab(a), B = oklab(b);
  return unlab(A[0] + (B[0] - A[0]) * t,
               A[1] + (B[1] - A[1]) * t,
               A[2] + (B[2] - A[2]) * t);
};

const ramp = (p, a, b) => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
};

export function initRebase() {
  const track = document.getElementById('rbTrack');
  const grid  = document.getElementById('rbGrid');
  const spec  = document.getElementById('rbSpec');
  if (!track || !grid || !spec) return;

  const stage  = track.querySelector('.rb__stage');
  const stepEl = document.getElementById('rbStep');
  const pctEl  = document.getElementById('rbPct');
  const noteEl = document.getElementById('rbNote');
  const dateEl = document.getElementById('rbDate');
  const tallyEl = document.getElementById('rbTally');

  /* build the swatches once */
  const rows = TOKENS.map((t, i) => {
    const el = document.createElement('div');
    el.className = 'rbc';
    el.style.setProperty('--i', i);
    el.innerHTML =
      '<span class="rbc__chip"></span>' +
      '<span class="rbc__meta">' +
        '<b class="mono rbc__name">' + t.name + '</b>' +
        '<span class="mono rbc__hex"></span>' +
        '<span class="mono rbc__use">' + t.use + '</span>' +
      '</span>';
    if (!t.from) el.setAttribute('data-added', '');
    grid.appendChild(el);
    return { t, el, chip: el.querySelector('.rbc__chip'), hex: el.querySelector('.rbc__hex'), last: '' };
  });

  function draw(p) {
    if (pctEl) pctEl.textContent = pad3(p);

    /* `stageIdx`, not `stage`: `stage` is the element, declared above, and a
       `const stage` here shadowed it for the whole function body. The tail
       of draw() then called `.style.setProperty` on a NUMBER and threw on
       every frame the instrument was on screen. It survived a console check
       because _track.js seeds with cb(0), and at p=0 this index is 0, which
       is falsy — so the guarded block was skipped and the page looked clean
       until someone actually scrolled to it. */
    const stageIdx = p < CUTS[0] ? 0 : p < CUTS[1] ? 1 : p < CUTS[2] ? 2 : p < CUTS[3] ? 3 : 4;
    swapText(stepEl, ['01 — THE SET THAT SHIPPED', '02 — THE REQUEST',
                      '03 — THE SWEEP', '04 — ONE TOKEN GAINED',
                      '05 — COMPONENTS REBUILT: 00'][stageIdx]);
    swapText(noteEl, NOTES[stageIdx]);

    /* The dateline is the clearest signal that this is one real change on
       one real day, so it flips at the midpoint of the sweep. */
    swapText(dateEl, p < 0.5 ? '2026 — 07 — 14' : '2026 — 07 — 28');

    rows.forEach((r, i) => {
      /* Stagger: each swatch starts STEP after the one above it, so the
         palette changes as a wave down the column rather than as one
         instantaneous swap nobody can follow. */
      const a = T0 + i * STEP;
      const t = ramp(p, a, a + SPAN);

      let hex;
      if (r.t.from) {
        hex = t <= 0 ? r.t.from : t >= 1 ? r.t.to : mixHex(r.t.from, r.t.to, t);
      } else {
        /* Added, not replaced: it fades up out of the ground rather than
           travelling from a colour that never existed. */
        hex = r.t.to;
        r.el.style.setProperty('--in', t.toFixed(3));
      }

      if (hex !== r.last) {
        r.last = hex;
        r.chip.style.background = hex;
        r.hex.textContent = hex;
        /* feed the specimen from the same values that paint the chips */
        spec.style.setProperty(r.t.name, hex);
      }
      r.el.style.setProperty('--t', t.toFixed(3));
    });

    if (tallyEl) {
      let moved = 0;
      rows.forEach((r, i) => {
        const a = T0 + i * STEP;
        if (r.t.from && ramp(p, a, a + SPAN) > 0.5) moved++;
      });
      swapText(tallyEl, String(moved).padStart(2, '0') + ' / 08 REPLACED');
    }

    /* the specimen lifts and settles across the sweep */
    spec.style.setProperty('--lift', (ramp(p, 0.10, 0.46) - ramp(p, 0.78, 1)).toFixed(3));

    /* THE TWO ENDS. Retiming stopped the sweep wasting scroll; these stop
       the remainder being motionless. The head of the track brings both
       panels in, and the tail locks the result — so every part of the
       track is doing something even where no token is moving. */
    const arrive = ramp(p, 0.00, 0.10);
    const settle = ramp(p, 0.84, 1.00);
    grid.style.setProperty('--arrive', arrive.toFixed(3));
    spec.style.setProperty('--arrive', arrive.toFixed(3));
    if (stage) {
      stage.style.setProperty('--settle', settle.toFixed(3));
      /* A scan line riding the wave down the column. It tracks the token
         that is actually mid-change, so it is a readout rather than a
         decoration: where the line is, is what is moving. */
      const wave = Math.min(1, Math.max(0, (p - T0) / (8 * STEP + SPAN)));
      stage.style.setProperty('--wave', wave.toFixed(4));
      stage.style.setProperty('--sweeping',
        (ramp(p, T0 - 0.03, T0 + 0.04) - ramp(p, 0.84, 0.92)).toFixed(3));
    }
  }

  if (REDUCED) { draw(1); return; }
  onTrack(track, draw);
}
