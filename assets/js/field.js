/* ══════════════════════════════════════════════════════════════════════
   ZYRN — SYS.07 · PRESENCE FIELD
   The shared GPGPU particle bed. Every page runs this same instrument on
   a different channel: same physics, same palette, a different program of
   formations and a different tilt/spin.

   Spec: docs/spec-presence-field.md
   Replaces the v1.0 scroll-scrubbed video bed entirely — there is no asset.

   USAGE
     import { initField } from './field.js';
     initField({
       program: [ {at:0, form:'S1'}, {at:1, form:'S4'} ],
       channel: { tilt:{S1:55}, spin:{S1:90} },   // deg, seconds/rev
       stats:   true,        // wire the hero stats strip if present
       onCount: (n, animate) => {...},            // Departure 5 headline
     });

   URL FLAGS
     ?nogl=1        force the flat typographic fallback
     ?freeze=S1..S4 pin one formation, fixed-dt substep, then latch (capture)
     ?p=0.28        pin scroll progress, same substepping (capture)
     ?probe=1       log a JSON perf/sim report to the console
     ?probeAt=N     which frame to report at (default 300)
     ?particles=N   override the count (rounded to a square)
     ?coarse=1      force the mobile path on desktop
     ?debug         lazy-load lil-gui

   NEVER pass desynchronized:true to any getContext here — it hard-froze the
   renderer on the owner's Windows machine. See CLAUDE.md.
   ══════════════════════════════════════════════════════════════════════ */

const T0 = performance.now();
const Q  = new URLSearchParams(location.search);

export const FLAGS = {
  nogl:      Q.get('nogl') === '1',
  freeze:    Q.get('freeze'),
  pin:       Q.has('p') ? Math.min(1, Math.max(0, parseFloat(Q.get('p')) || 0)) : null,
  probe:     Q.get('probe') === '1',
  probeAt:   Math.max(30, parseInt(Q.get('probeAt') || '300', 10) || 300),
  particles: parseInt(Q.get('particles') || '', 10),
  coarse:    Q.get('coarse') === '1',
  debug:     Q.has('debug'),
};

const TAU = Math.PI * 2;
const COARSE = FLAGS.coarse || matchMedia('(pointer:coarse)').matches;
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
let REDUCED = mqReduce.matches;
mqReduce.addEventListener('change', e => { REDUCED = e.matches; });

/* ── deterministic RNG. A brand's signature image should not be a
      different image on every visit. ─────────────────────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const SEED = 0x5A79524E;                    // "ZYRN"

/* ── formation defaults. `channel` overrides tilt (deg) and spin
      (seconds per revolution) per page. ─────────────────────────────── */
const FORM_BASE = {
  S1: { tilt: 55, secs:  90, name: 'S1 FIELD'    },
  S2: { tilt:  0, secs: 240, name: 'S2 DISPERSE' },
  S3: { tilt: 18, secs: 140, name: 'S3 CORE'     },
  S4: { tilt:  0, secs: 600, name: 'S4 RELEASE'  },
};
const ORDER = ['S1', 'S2', 'S3', 'S4'];

/* ══ CONTINUITY ══════════════════════════════════════════════════════
   Every page runs the same field off the same seed, so the bed does not
   have to blink between documents — it can carry through the navigation
   and let only the type swap. Two halves:

     leaving  the field morphs to whatever formation the DESTINATION
              opens on while the content fades out, then we navigate
     landing  the incoming page reads the handoff, builds its particles
              already settled in that formation instead of assembling
              them from a shell, and fades its content in

   The result reads as one surface changing channels rather than as two
   pages. Handoff is deliberately short-lived: a stale one (back button
   hours later, a restored tab) must not suppress the intro. */
const ROUTES = {
  '': 'S3', 'index.html': 'S3', 'brand.html': 'S3',
  'foundation.html': 'S1',
  'services.html': 'S3',
  'lumina.html': 'S2',
  'duk.html': 'S2',
  'axes.html': 'S3',
  'website-design.html': 'S1',
  'brand-kit.html': 'S3',
  'business-structuring.html': 'S3',
  'ai-transformation.html': 'S1',
  'human-capital.html': 'S1', 'web-strategy.html': 'S1',
};
const HANDOFF_KEY = 'zyrn:handoff';
const HANDOFF_TTL = 4000;

function readHandoff() {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw);
    if (!h || !ORDER.includes(h.form)) return null;
    if (Date.now() - (h.t || 0) > HANDOFF_TTL) return null;
    return h;
  } catch (e) { return null; }
}
function routeFor(href) {
  try {
    const file = new URL(href, location.href).pathname.split('/').pop() || '';
    return ROUTES[file] || null;
  } catch (e) { return null; }
}

/* ── RAMPS ──────────────────────────────────────────────────────────
   `vivid` is the default. It puts a green-teal at the cold end and runs
   teal → cyan → Pulse → Vapor, which is what gives the field real hue
   travel instead of a grey-to-indigo luminance ramp. Pulse stays the
   dominant anchor stop; the two cold stops are the departure.

   `strict` is the original in-palette ramp (Steel → Pulse → Pulse+ →
   Vapor). Swap with `initField({ ramp: 'strict' })` — one word per page,
   nothing else changes.

   `intensity` scales the emitted colour above 1.0 so the additive blend
   pushes past the bloom threshold. It is the difference between a field
   that is coloured and a field that glows. */
const RAMPS = {
  vivid:  { stops: [0x5FE3B0, 0x33C9DE, 0x6E56F8, 0xF2F3F5],
            pos: [0.36, 0.72, 1.0], intensity: 1.34 },
  strict: { stops: [0x767E8C, 0x6E56F8, 0xA99BFF, 0xF2F3F5],
            pos: [0.42, 0.78, 1.0], intensity: 1.0 },
};

/* ══ SHADER CHUNKS ═══════════════════════════════════════════════════ */

/* Simplex noise returning an ANALYTIC gradient. Curl then costs three
   evaluations per octave instead of the eighteen a finite-difference curl
   needs — an 83% cut in the dominant cost of the sim. */
const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoiseG(vec3 v, out vec3 grad){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  vec4 m2 = m * m;
  vec4 m4 = m2 * m2;
  vec4 pdotx = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));
  vec4 temp = m2 * m * pdotx;
  grad  = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  grad += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  grad *= 42.0;
  return 42.0 * dot(m4, pdotx);
}

vec3 curl1(vec3 p){
  vec3 gx, gy, gz;
  snoiseG(p,                             gx);
  snoiseG(p + vec3(123.4,  56.7,  89.1), gy);
  snoiseG(p + vec3(-45.6,  78.9, -12.3), gz);
  return vec3(gz.y - gy.z, gx.z - gz.x, gy.x - gx.y);
}

vec3 curlFbm(vec3 p, float oct){
  vec3 c = curl1(p);
  if (oct > 1.5) c += curl1(p * 2.1) * 0.5;
  if (oct > 2.5) c += curl1(p * 4.3) * 0.25;
  return c;
}
`;

/* identical maths in sim and render, so colour and position always agree
   about how far a given particle has travelled */
const MORPH = /* glsl */`
float morphM(float mix01, float seed, float w){
  float t0 = seed * (1.0 - w);
  return smoothstep(t0, t0 + w, mix01);
}
`;

const VELOCITY_FS = NOISE + MORPH + /* glsl */`
uniform float uDt, uTime;
uniform float uSpring, uDamping, uTurbulence, uNoiseScale, uNoiseSpeed;
uniform float uOvershoot, uStaggerW, uOctaves, uGravity;
uniform sampler2D uTargetA, uTargetB;
uniform float uMix;
uniform mat3 uMatA, uMatB;
uniform vec3 uRayOrigin, uRayDir;
uniform float uPointerRadius, uRepel, uVortex, uPointerGain, uPointerMode, uPointerOn;
uniform vec3  uShockOrigin;
uniform float uShockT, uShockAmp, uShockSpeed, uShockWidth;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  float seed = V.w;
  float dt = min(uDt, 0.0333);

  vec4 tA = texture2D(uTargetA, uv);
  vec4 tB = texture2D(uTargetB, uv);
  vec3 A = uMatA * tA.xyz;
  vec3 B = uMatB * tB.xyz;

  float m = morphM(uMix, seed, uStaggerW);
  // the sin() bulge peaks mid-flight and is exactly zero at both ends, so
  // it can never disturb a settled formation
  vec3 target = mix(A, B, m) + (B - A) * uOvershoot * sin(3.14159265 * m);

  vec3 acc = (target - P.xyz) * uSpring;
  acc -= V.xyz * uDamping;
  // Turbulence is LAYERED BY DEPTH. One uniform noise field over the whole
  // volume reads as fizz — every particle agitated the same amount, so the
  // parallax has nothing to work against. Slower and broader at the back,
  // tighter and quicker at the front, and the camera's own drift then reads
  // as depth rather than as sliding.
  float layer = smoothstep(-2.6, 2.6, P.z);
  float lScale = mix(0.78, 1.34, layer);
  float lTurb  = mix(0.84, 1.26, layer);
  acc += curlFbm(P.xyz * uNoiseScale * lScale
                 + vec3(0.13, 0.07, 0.21) * uTime * uNoiseSpeed, uOctaves)
         * uTurbulence * lTurb;
  acc.y -= uGravity;

  // THE SHOCK. A click sends a spherical shell of outward impulse through
  // the field: the front travels at uShockSpeed, the gaussian gives it
  // thickness, and uShockAmp decays to nothing in about a second. It is the
  // only thing here that answers a deliberate act rather than presence.
  if (uShockAmp > 0.001){
    vec3 sd = P.xyz - uShockOrigin;
    float sr = length(sd);
    float front = uShockT * uShockSpeed;
    float shell = exp(-pow((sr - front) / uShockWidth, 2.0));
    acc += (sr > 1e-4 ? sd / sr : vec3(0.0, 1.0, 0.0)) * shell * uShockAmp;
  }

  if (uPointerOn > 0.5){
    // distance to the pointer RAY, not to a point: a sphere of influence
    // pokes at the field, a channel through its depth tears one open
    vec3 w = P.xyz - uRayOrigin;
    float t = max(dot(w, uRayDir), 0.0);
    vec3 delta = P.xyz - (uRayOrigin + uRayDir * t);
    float d = length(delta);
    float fall = 1.0 - smoothstep(0.0, uPointerRadius, d);
    if (fall > 0.0){
      vec3 away = d > 1e-4 ? delta / d : vec3(0.0, 1.0, 0.0);
      vec3 cr = cross(uRayDir, away);
      float cl = length(cr);
      vec3 swirl = cl > 1e-4 ? cr / cl : vec3(0.0);
      acc += fall * uPointerGain * uPointerMode * (uRepel * away + uVortex * swirl);
    }
  }

  gl_FragColor = vec4(V.xyz + acc * dt, seed);
}
`;

const POSITION_FS = /* glsl */`
uniform float uDt;
uniform vec3  uRayOrigin, uRayDir, uShockOrigin;
uniform float uPointerRadius, uPointerOn;
uniform float uShockT, uShockHeat, uShockSpeed, uShockWidth;
uniform float uHeatGain, uHeatDecay;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  float dt = min(uDt, 0.0333);
  P.xyz += V.xyz * dt;

  /* ── HEAT ──────────────────────────────────────────────────────────
     P.w used to carry a rolling twinkle phase. Twinkle needs no memory —
     it is a function of the clock and the particle's permanent seed — so
     the only spare component in the whole simulation was being spent on
     something stateless. It now carries EXCITATION: what this particle has
     recently been through. The pointer heats what it passes; the shock
     heats the shell it travels through; everything cools exponentially.

     This is what makes the pointer leave a WAKE rather than just a dent.
     A dent is geometry and disappears the moment the spring wins; a wake
     is memory, and it is the difference between a field that reacts and a
     field that remembers being touched. */
  float heat = P.w;

  if (uPointerOn > 0.5){
    vec3 w = P.xyz - uRayOrigin;
    float t = max(dot(w, uRayDir), 0.0);
    float d = length(P.xyz - (uRayOrigin + uRayDir * t));
    heat += (1.0 - smoothstep(0.0, uPointerRadius, d)) * uHeatGain * dt;
  }

  if (uShockHeat > 0.001){
    float sr = distance(P.xyz, uShockOrigin);
    float front = uShockT * uShockSpeed;
    heat += exp(-pow((sr - front) / uShockWidth, 2.0)) * uShockHeat * 3.6 * dt;
  }

  P.w = clamp(heat - heat * uHeatDecay * dt, 0.0, 1.0);
  gl_FragColor = P;
}
`;

const POINTS_VS = MORPH + /* glsl */`
uniform sampler2D uPos, uVel, uTargetA, uTargetB;
uniform float uMix, uStaggerW;
uniform float uSize, uMaxSize, uAlpha, uAttenuation, uPixelRatio;
uniform float uFocal, uDofSpread, uDofFade;
uniform vec3  uRamp0, uRamp1, uRamp2, uRamp3, uRampPos;
uniform float uSpeedTint, uSpeedNorm, uGlobalAlpha, uIntensity;
uniform float uTime, uHeatRamp, uHeatGlow, uHeatSize;
uniform vec3  uDwellPoint;
uniform float uDwellRadius, uDwellGlow;
uniform vec4  uTextRects[6];
uniform float uKeepoutFloor;

attribute vec2 reference;
varying vec3 vColor;
varying float vAlpha;

vec3 ramp(float t){
  vec3 c = mix(uRamp0, uRamp1, smoothstep(0.0, uRampPos.x, t));
  c = mix(c, uRamp2, smoothstep(uRampPos.x, uRampPos.y, t));
  c = mix(c, uRamp3, smoothstep(uRampPos.y, uRampPos.z, t));
  return c;
}
float boxFalloff(vec2 p, vec4 r){
  vec2 h = (r.zw - r.xy) * 0.5;
  if (h.x <= 0.0 || h.y <= 0.0) return 0.0;
  vec2 c = (r.xy + r.zw) * 0.5;
  vec2 d = abs(p - c) / max(h, vec2(1e-4));
  return 1.0 - smoothstep(0.82, 1.0, max(d.x, d.y));
}

void main(){
  vec4 P = texture2D(uPos, reference);
  vec4 V = texture2D(uVel, reference);
  float seed = V.w;

  vec4 mv = modelViewMatrix * vec4(P.xyz, 1.0);
  float dist = max(-mv.z, 0.001);
  float coc  = abs(dist - uFocal);

  float heat = P.w;

  // Twinkle is stateless now: the clock and the seed are enough, and each
  // particle keeps its own rate so the field never pulses as one body.
  // That is what freed P.w for heat.
  float jitter  = 0.72 + seed * 0.66;
  float twinkle = 0.86 + 0.14 * sin(uTime * (0.7 + seed * 1.7) + seed * 20.0);

  float psize = uSize * jitter * twinkle * (uAttenuation / dist);
  psize *= 1.0 + coc * uDofSpread;
  psize *= 1.0 + heat * uHeatSize;
  psize = min(psize, uMaxSize);

  float alpha = uAlpha / (1.0 + coc * coc * uDofFade);
  alpha *= 1.0 + heat * 0.85;

  // the colour parameter rides in .w of the target textures, so colour
  // needs no texture of its own and morphs for free alongside position
  float m  = morphM(uMix, seed, uStaggerW);
  float cp = mix(texture2D(uTargetA, reference).w, texture2D(uTargetB, reference).w, m);

  // Speed and heat ride the RAMP rather than being added on top of it.
  // The old line added a SCALAR to all three channels at once,
  // which is a white wash — so the faster a particle moved, the further it
  // left the palette. Travelling ALONG the ramp instead
  // means motion reads as hue and every colour on screen is still one of
  // the four stops.
  float sp = clamp(length(V.xyz) * uSpeedNorm, 0.0, 1.0);
  float cp2 = clamp(cp + sp * uSpeedTint + heat * uHeatRamp, 0.0, 1.0);
  vec3 col = ramp(cp2);
  col *= 1.0 + heat * uHeatGlow;

  if (uDwellGlow > 0.001){
    float dd = 1.0 - smoothstep(0.0, uDwellRadius, distance(P.xyz, uDwellPoint));
    col   += uRamp3 * dd * uDwellGlow * 0.55;
    alpha *= 1.0 + dd * uDwellGlow * 0.8;
  }

  vec4 clip = projectionMatrix * mv;
  vec2 ndc  = clip.xy / max(clip.w, 1e-4);
  float k = 0.0;
  for (int i = 0; i < 6; i++) k = max(k, boxFalloff(ndc, uTextRects[i]));
  alpha *= mix(1.0, uKeepoutFloor, k);

  vColor = col * uIntensity;
  vAlpha = alpha * uGlobalAlpha;

  gl_Position  = clip;
  gl_PointSize = psize * uPixelRatio;
}
`;

const POINTS_FS = /* glsl */`
precision highp float;
varying vec3 vColor;
varying float vAlpha;
uniform float uFalloff;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard;
  // subtracting the edge value removes the faint hard rim a plain gaussian
  // leaves on additive points
  float a = exp(-r2 * uFalloff) - exp(-0.25 * uFalloff);
  gl_FragColor = vec4(vColor * vAlpha * a, 1.0);
}
`;

const BG_VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }
`;

const BG_FS = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect;
uniform vec3 uInk, uEdge, uPulse, uSteel;

// 8x8 ordered Bayer. Without it a near-black radial gradient bands visibly
// on 8-bit panels — fatal on a page whose argument is rendering quality.
float bayer(vec2 p){
  vec2 f = floor(mod(p, 8.0));
  float b = 0.0, s = 1.0;
  for (int i = 0; i < 3; i++){
    vec2 h = floor(mod(f, 2.0));
    b += s * (h.x + 2.0 * mod(h.x + h.y, 2.0)) * 0.25;
    f = floor(f * 0.5); s *= 0.25;
  }
  return b;
}
float blob(vec2 uv, vec2 c, float r){
  return 1.0 - smoothstep(0.0, r, length((uv - c) * vec2(uAspect, 1.0)));
}
void main(){
  vec2 uv = vUv;
  float v = length((uv - 0.5) * vec2(uAspect, 1.0) * 1.35);
  vec3 col = mix(uInk, uEdge, smoothstep(0.15, 1.05, v));

  float t1 = uTime / 71.0, t2 = uTime / 97.0;   // coprime — never re-sync
  vec2 c1 = vec2(0.24 + 0.06 * sin(t1 * 6.2831), 0.76 + 0.05 * cos(t1 * 6.2831));
  vec2 c2 = vec2(0.79 + 0.05 * cos(t2 * 6.2831), 0.22 + 0.06 * sin(t2 * 6.2831));
  col += uPulse * blob(uv, c1, 0.62) * 0.030;
  col += uSteel * blob(uv, c2, 0.58) * 0.025;

  col += (bayer(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ══ FORMATION TARGETS ═══════════════════════════════════════════════
   xyz = target position in formation-local space (tilt and spin are
   applied per frame in the shader), w = colour parameter 0..1 */
function buildTargets(N) {
  const rnd = mulberry32(SEED);
  const gauss = () => {
    let u = 0; while (u === 0) u = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rnd());
  };

  const S1 = new Float32Array(N * 4);
  const S2 = new Float32Array(N * 4);
  const S3 = new Float32Array(N * 4);
  const S4 = new Float32Array(N * 4);
  const R = 3.05, ARMS = 4, K = 2.6;

  for (let i = 0; i < N; i++) {
    const o = i * 4;

    /* S1 — log-spiral in the local XY plane */
    if (rnd() < 0.08) {                                   // 8% tight core
      const rr = Math.pow(rnd(), 1.5) * 0.34;
      const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
      S1[o]     = rr * Math.sin(ph) * Math.cos(th);
      S1[o + 1] = rr * Math.sin(ph) * Math.sin(th);
      S1[o + 2] = rr * Math.cos(ph) * 0.85;
      S1[o + 3] = 0.90 + rnd() * 0.10;                    // nucleus
    } else {
      const r   = R * Math.pow(rnd(), 1.3);
      const arm = (rnd() * ARMS) | 0;
      // 1-sigma ~8 degrees at the rim. Wider and four arms merge into a disc.
      const scat = gauss() * (0.035 + 0.11 * (r / R));
      const ang  = arm * TAU / ARMS + K * Math.log(Math.max(r, 0.05)) + scat;
      S1[o]     = Math.cos(ang) * r;
      S1[o + 1] = Math.sin(ang) * r;
      S1[o + 2] = gauss() * 0.20 * Math.exp(-r / (R * 0.6));
      // exponent 1.2, not 2.4: steeper and the whole disc lands on the Steel
      // end of the ramp and the field reads grey instead of Pulse
      S1[o + 3] = Math.pow(Math.max(0, 1 - r / R), 1.2);
    }

    /* S2 — entropy. Wider AND dimmer: that is the argument. */
    S2[o]     = (rnd() * 2 - 1) * 4.4;
    S2[o + 1] = (rnd() * 2 - 1) * 2.8;
    S2[o + 2] = (rnd() * 2 - 1) * 3.0;
    S2[o + 3] = rnd() * 0.22;

    /* S3 — torus, ring in local XY, axis Z, so it faces the viewer.
       Tube/major ratio is what decides whether this reads as a wire ring or
       as a solid volume with a hole punched through it. At r/R = 0.32 it was
       a ring; 0.50 gives a hole about a third of the outer diameter, which
       is the proportion that reads as mass. */
    {
      const u = rnd() * TAU, v = rnd() * TAU;
      const Rr = 1.36;
      // sqrt keeps the tube's cross-section evenly filled instead of piling
      // everything on the axis, then a soft tail sprays the outer edge
      const fill = Math.sqrt(rnd());
      const rr = 0.68 * (fill + (rnd() < 0.14 ? rnd() * 0.30 : 0));
      const cv = Math.cos(v), sv = Math.sin(v);
      S3[o]     = (Rr + rr * cv) * Math.cos(u);
      S3[o + 1] = (Rr + rr * cv) * Math.sin(u);
      S3[o + 2] = rr * sv;

      // Colour by HEIGHT, not by facing: the ring should run cool at the top
      // and violet underneath, which is a spatial gradient across the whole
      // form. Facing only adds a narrow lift on the rim turned to camera.
      const yN = (S3[o + 1] / (Rr + 0.68) + 1) * 0.5;     // 0 bottom → 1 top
      const facing = Math.max(0, sv);
      S3[o + 3] = Math.min(0.97,
        0.04 + 0.82 * (1 - yN) + 0.14 * Math.pow(facing, 6));
    }

    /* S4 — drifting slab, biased in front of the camera. Tighter and
       brighter than it was: spread over +-8 x +-5 x 11 with a colour
       parameter capped at 0.35, the release landed on SYS.05 as a nearly
       black screen, which reads as an empty page rather than as silence. */
    S4[o]     = (rnd() * 2 - 1) * 6.4;
    S4[o + 1] = (rnd() * 2 - 1) * 4.0;
    S4[o + 2] = -8.0 + rnd() * 8.6;
    S4[o + 3] = 0.10 + rnd() * 0.52;
  }
  return { S1, S2, S3, S4 };
}

/* ══ PUBLIC ══════════════════════════════════════════════════════════ */

export function initField(cfg = {}) {
  const canvas = document.getElementById(cfg.canvas || 'field');
  const flat = (reason) => {
    document.body.classList.add('is-flat');
    document.querySelectorAll('[data-reveal],.rv').forEach(el => el.classList.add('is-in'));
    if (typeof cfg.onFlat === 'function') cfg.onFlat();
    if (reason) console.info('[ZYRN] field flat:', reason);
  };
  if (!canvas) return Promise.resolve(null);
  if (FLAGS.nogl) { flat('?nogl=1'); return Promise.resolve(null); }
  return boot(canvas, cfg).catch(err => { console.error(err); flat(err && err.message); return null; });
}

async function boot(canvas, cfg) {
  const THREE = await import('three');
  const { GPUComputationRenderer } = await import('three/addons/misc/GPUComputationRenderer.js');
  const { EffectComposer }  = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass }      = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass }      = await import('three/addons/postprocessing/OutputPass.js');

  /* Lenis is an enhancement — if the CDN blips, native scroll still works */
  let Lenis = null;
  try { Lenis = (await import('lenis')).default; }
  catch (e) { console.warn('[ZYRN] lenis unavailable, native scroll'); }

  /* ── program ──────────────────────────────────────────────────────── */
  const program = (cfg.program && cfg.program.length >= 2)
    ? cfg.program.slice().sort((a, b) => a.at - b.at)
    : [{ at: 0, form: 'S1' }, { at: 1, form: 'S1' }];

  const chTilt = (cfg.channel && cfg.channel.tilt) || {};
  const chSpin = (cfg.channel && cfg.channel.spin) || {};
  const FORM = {};
  for (const k of ORDER) {
    const b = FORM_BASE[k];
    FORM[k] = {
      tilt: (chTilt[k] ?? b.tilt) * Math.PI / 180,
      rate: TAU / (chSpin[k] ?? b.secs),
      name: b.name,
    };
  }

  function stateAt(p) {
    for (let i = 0; i < program.length - 1; i++) {
      const a = program[i], b = program[i + 1];
      if (p <= b.at || i === program.length - 2) {
        const span = Math.max(1e-6, b.at - a.at);
        const m = Math.min(1, Math.max(0, (p - a.at) / span));
        return { a: a.form, b: b.form, m: a.form === b.form ? 0 : m };
      }
    }
    return { a: program[0].form, b: program[0].form, m: 0 };
  }
  function stateName(st) {
    if (st.a === st.b) return FORM[st.a].name;
    return FORM[st.a].name.split(' ')[0] + ' → ' + FORM[st.b].name.split(' ')[0];
  }

  /* ── tier heuristic (a guess; the governor is the real authority) ─── */
  function pickTier() {
    if (Number.isFinite(FLAGS.particles)) {
      const s = Math.round(Math.sqrt(Math.min(Math.max(FLAGS.particles, 1024), 160000)));
      return s * s;
    }
    const cap = cfg.maxCount || 90000;
    if (COARSE) return Math.min(cap, 14400);
    const cores = navigator.hardwareConcurrency || 4;
    const mem   = navigator.deviceMemory || 8;
    if (cores <= 4 || mem <= 4) return Math.min(cap, 14400);
    if (cores <= 8 && mem <= 8) return Math.min(cap, 40000);
    return cap;
  }

  /* ── renderer ─────────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: false,
    powerPreference: 'high-performance', stencil: false, depth: false,
  });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 required');
  renderer.setClearColor(0x0E0F12, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const DPR_CAP = COARSE ? 1.5 : 2.0;
  let dprScale = 1.0;
  const dpr = () => Math.min(window.devicePixelRatio || 1, DPR_CAP) * dprScale;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.6);

  const bgMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: 1 },
      uInk:  { value: new THREE.Color(0x0E0F12) },
      uEdge: { value: new THREE.Color(0x08090B) },
      uPulse:{ value: new THREE.Color(0x6E56F8) },
      uSteel:{ value: new THREE.Color(0x767E8C) },
    },
    vertexShader: BG_VS, fragmentShader: BG_FS,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bg.renderOrder = -1;
  scene.add(bg);

  /* ── sim ──────────────────────────────────────────────────────────── */
  const HANDOFF = readHandoff();
  const ENTER_FORM = HANDOFF ? HANDOFF.form : null;
  if (HANDOFF) document.body.classList.add('is-entering');

  let COUNT = pickTier();
  const RAMP = RAMPS[cfg.ramp] || RAMPS.vivid;
  const RAMP_POS = (cfg.rampPos || RAMP.pos).slice();
  const TURB = { base: cfg.turbulence ?? 0.16 };
  let SIDE, gpu, posVar, velVar, points, targets, targetTex = {};
  let uSim = null, uPts = null;

  if (typeof cfg.onCount === 'function') cfg.onCount(COUNT, false);

  function disposeSim() {
    if (points) { scene.remove(points); points.geometry.dispose(); points.material.dispose(); points = null; }
    for (const k in targetTex) targetTex[k].dispose();
    targetTex = {};
    if (gpu) { gpu.dispose(); gpu = null; }
  }

  function buildSim(count) {
    disposeSim();
    SIDE  = Math.round(Math.sqrt(count));
    COUNT = SIDE * SIDE;

    targets = buildTargets(COUNT);
    for (const k of ORDER) {
      const t = new THREE.DataTexture(targets[k], SIDE, SIDE, THREE.RGBAFormat, THREE.FloatType);
      t.needsUpdate = true;
      targetTex[k] = t;
    }

    gpu = new GPUComputationRenderer(SIDE, SIDE, renderer);
    const pos0 = gpu.createTexture();
    const vel0 = gpu.createTexture();
    {
      const p = pos0.image.data, v = vel0.image.data;
      const r2 = mulberry32(SEED ^ 0x9E3779B9);
      // Arriving from another page: place every particle already ON the
      // formation the previous page morphed to, so the bed is continuous
      // across the navigation. Otherwise start on a shell, so a cold load
      // READS as an assembly.
      const enter = ENTER_FORM ? targets[ENTER_FORM] : null;
      const tilt = ENTER_FORM ? FORM[ENTER_FORM].tilt : 0;
      const ct = Math.cos(tilt), stt = Math.sin(tilt);
      for (let i = 0; i < COUNT; i++) {
        const o = i * 4;
        if (enter) {
          const x = enter[o], y = enter[o + 1], z = enter[o + 2];
          // rotation about X only: spin is 0 at t=0 on both sides
          p[o]     = x            + (r2() - 0.5) * 0.03;
          p[o + 1] = y * ct - z * stt + (r2() - 0.5) * 0.03;
          p[o + 2] = y * stt + z * ct + (r2() - 0.5) * 0.03;
        } else {
          const th = r2() * TAU, ph = Math.acos(2 * r2() - 1), rr = 3.2 + r2() * 2.4;
          p[o]     = rr * Math.sin(ph) * Math.cos(th);
          p[o + 1] = rr * Math.sin(ph) * Math.sin(th);
          p[o + 2] = rr * Math.cos(ph);
        }
        p[o + 3] = 0;            // heat: every particle starts cold
        v[o] = v[o + 1] = v[o + 2] = 0;
        v[o + 3] = r2();                       // the permanent per-particle seed
      }
    }

    velVar = gpu.addVariable('textureVelocity', VELOCITY_FS, vel0);
    posVar = gpu.addVariable('texturePosition', POSITION_FS, pos0);
    gpu.setVariableDependencies(velVar, [velVar, posVar]);
    gpu.setVariableDependencies(posVar, [velVar, posVar]);

    uSim = velVar.material.uniforms;
    Object.assign(uSim, {
      uDt:{value:0}, uTime:{value:0},
      uSpring:{value:9.0}, uDamping:{value:5.2},
      uTurbulence:{value:TURB.base}, uNoiseScale:{value:0.75}, uNoiseSpeed:{value:0.5},
      uOvershoot:{value:0.06}, uStaggerW:{value:0.45}, uOctaves:{value:3.0},
      uGravity:{value:0.0},
      uTargetA:{value:targetTex.S1}, uTargetB:{value:targetTex.S1}, uMix:{value:0},
      uMatA:{value:new THREE.Matrix3()}, uMatB:{value:new THREE.Matrix3()},
      uRayOrigin:{value:new THREE.Vector3()}, uRayDir:{value:new THREE.Vector3(0,0,-1)},
      uPointerRadius:{value:0.9}, uRepel:{value:26.0}, uVortex:{value:15.0},
      uPointerGain:{value:1.0}, uPointerMode:{value:1.0}, uPointerOn:{value:0.0},
      uShockOrigin:{value:new THREE.Vector3()}, uShockT:{value:0},
      uShockAmp:{value:0}, uShockSpeed:{value:2.5}, uShockWidth:{value:0.40},
    });
    // The position pass needs the pointer and the shock too: heat lives in
    // P.w, and only this pass can write it.
    Object.assign(posVar.material.uniforms, {
      uDt:{value:0},
      uRayOrigin:uSim.uRayOrigin, uRayDir:uSim.uRayDir,
      uShockOrigin:uSim.uShockOrigin,
      uPointerRadius:uSim.uPointerRadius, uPointerOn:uSim.uPointerOn,
      uShockT:uSim.uShockT, uShockHeat:{value:0},
      uShockSpeed:uSim.uShockSpeed, uShockWidth:uSim.uShockWidth,
      uHeatGain:{value:2.6}, uHeatDecay:{value:1.5},
    });

    const err = gpu.init();
    if (err !== null) throw new Error('GPUComputationRenderer: ' + err);

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const ref = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      ref[i * 2]     = (i % SIDE) / SIDE + 0.5 / SIDE;
      ref[i * 2 + 1] = Math.floor(i / SIDE) / SIDE + 0.5 / SIDE;
    }
    geo.setAttribute('position',  new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('reference', new THREE.BufferAttribute(ref, 2));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

    const mat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VS, fragmentShader: POINTS_FS,
      blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, transparent: true,
      uniforms: {
        uPos:{value:null}, uVel:{value:null},
        uTargetA:{value:targetTex.S1}, uTargetB:{value:targetTex.S1},
        uMix:{value:0}, uStaggerW:{value:0.45},
        uSize:{value:1.0}, uMaxSize:{value:48.0},
        /* A phone runs 14,400 particles against a desktop's 90,000 — the same
           formations, roughly a sixth of the density. Left alone the torus
           stops reading as a torus and becomes dust, which loses the one image
           the brand is built on. Bigger, slightly brighter points cover the
           gaps: the shape survives the count. */
        uAlpha:{value:(cfg.alpha ?? 0.55) * (COARSE ? 1.18 : 1)},
        uAttenuation:{value:COARSE ? 16.5 : 11.0}, uPixelRatio:{value:1},
        uFocal:{value:6.3}, uDofSpread:{value:0.16}, uDofFade:{value:0.10},
        uRamp0:{value:new THREE.Color(RAMP.stops[0])},
        uRamp1:{value:new THREE.Color(RAMP.stops[1])},
        uRamp2:{value:new THREE.Color(RAMP.stops[2])},
        uRamp3:{value:new THREE.Color(RAMP.stops[3])},
        uRampPos:{value:new THREE.Vector3(...(cfg.rampPos || RAMP.pos))},
        uIntensity:{value:cfg.intensity ?? RAMP.intensity},
        // uSpeedTint is a RAMP OFFSET now, not an additive tint, so the old
        // 0.09 would have been imperceptible — it used to be added to every
        // channel, it is now a distance travelled along a 0..1 palette.
        uSpeedTint:{value:0.26}, uSpeedNorm:{value:0.35}, uGlobalAlpha:{value:1.0},
        uTime:{value:0},
        uHeatRamp:{value:0.52}, uHeatGlow:{value:0.58}, uHeatSize:{value:0.62},
        uDwellPoint:{value:new THREE.Vector3()}, uDwellRadius:{value:0.9}, uDwellGlow:{value:0},
        uTextRects:{value:Array.from({length:6}, () => new THREE.Vector4(0,0,-1,-1))},
        uKeepoutFloor:{value:0.22},
        uFalloff:{value:9.0},
      },
    });
    uPts = mat.uniforms;

    points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
  }
  buildSim(COUNT);

  /* ── post ─────────────────────────────────────────────────────────── */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // the spec set 0.35 as a ceiling against a grey-to-indigo ramp; the vivid
  // ramp carries real chroma and needs the extra lift to actually glow
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), cfg.bloom ?? 0.46, 0.62, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  let bloomOn = true;

  /* ── text keep-out ────────────────────────────────────────────────
     Resolves the source brief's contradiction: particles still cross the
     type, they just stop blowing it out. Additive light behind Vapor
     LOWERS contrast, so "do not mask" and ">=4.5:1" cannot both hold. */
  const keepSel = cfg.keepout || '[data-keepout]';
  let keepEls = [...document.querySelectorAll(keepSel)];
  let vw = 0, vh = 0, lastH = 0;

  function measureRects() {
    if (!uPts || !vw || !vh) return;
    const rects = uPts.uTextRects.value;
    let n = 0;
    for (const el of keepEls) {
      if (n >= 6) break;
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40 || r.width < 4) continue;
      const mx = r.width * 0.06, my = r.height * 0.22;
      rects[n++].set(
        ((r.left - mx) / vw) * 2 - 1,
        1 - ((r.bottom + my) / vh) * 2,
        ((r.right + mx) / vw) * 2 - 1,
        1 - ((r.top - my) / vh) * 2,
      );
    }
    for (let i = n; i < 6; i++) rects[i].set(0, 0, -1, -1);
  }

  function applySize() {
    const w = window.innerWidth, h = window.innerHeight;
    vw = w; vh = h;
    const r = dpr();
    renderer.setPixelRatio(r);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(r);
    composer.setSize(w, h);
    bloom.resolution.set(Math.max(1, (w * r) / 2), Math.max(1, (h * r) / 2));   // half-res chain
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uAspect.value = w / h;
    if (uPts) uPts.uPixelRatio.value = r;
    lastH = h;
    measureRects();
  }
  let rzT = 0;
  addEventListener('resize', () => {
    // mobile URL-bar damping: ignore height-only changes under 120px
    if (window.innerWidth === vw && Math.abs(window.innerHeight - lastH) < 120) return;
    clearTimeout(rzT); rzT = setTimeout(applySize, 150);
  }, { passive: true });
  applySize();

  /* ── scroll ───────────────────────────────────────────────────────── */
  let progress = 0, scrollVel = 0, scrollVelSm = 0, lenis = null;
  const nativeProgress = () => {
    const lim = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / lim));
  };

  if (Lenis && !REDUCED) {
    /* lerp, not duration. A duration restarts an eased animation toward a new
       target on every wheel event, so at 1.05s the page trails the input by
       about a second and reads as "scrolling does nothing". A lerp tracks the
       target continuously and responds on the first frame.
       syncTouch stays off: native touch scrolling on phones is better than
       anything we would synthesise, and Lenis still reports progress. */
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1, syncTouch: false });
    lenis.on('scroll', (e) => {
      progress  = Math.min(1, Math.max(0, e.progress ?? nativeProgress()));
      scrollVel = e.velocity || 0;
    });

    /* scroll-behavior is now `auto` (it has to be, see styles.css), so in-page
       anchors would jump instantly. Route them through Lenis instead. */
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -76, duration: 1.1 });
      history.replaceState(null, '', href);
    });
  } else {
    let prevY = window.scrollY, prevT = performance.now();
    addEventListener('scroll', () => {
      const now = performance.now(), y = window.scrollY;
      scrollVel = (y - prevY) / Math.max(1, now - prevT) * 16.67;
      prevY = y; prevT = now;
      progress = nativeProgress();
    }, { passive: true });
    progress = nativeProgress();
  }

  /* ── pointer ──────────────────────────────────────────────────────── */
  const ptr = {
    ndc: new THREE.Vector2(0, 0), prev: new THREE.Vector2(0, 0),
    speed: 0, active: false, lastMove: -1e9, mode: 1,
  };
  const rc = new THREE.Raycaster();
  const ray = new THREE.Ray();
  let lastInput = performance.now();

  /* THE SHOCK. One click, one expanding shell. `t` is seconds since it was
     fired and drives the radius; `amp` decays to nothing over SHOCK_LIFE and
     drives both the impulse and the heat. Firing again simply restarts it —
     two overlapping shells would need two sets of uniforms and the second
     one is never worth what it costs. */
  // 0.95s and a narrow shell: the first build ran 1.15s at almost twice
  // this amplitude and put a viewport-filling white ring over the hero.
  // Doctrine rule 1 is that silence is the luxury — a click may disturb
  // the field, it may not take the page over.
  const SHOCK_LIFE = 0.95;
  const shock = { t: 0, amp: 0, origin: new THREE.Vector3() };

  const onPointer = (x, y) => {
    ptr.ndc.set((x / vw) * 2 - 1, -(y / vh) * 2 + 1);
    ptr.active = true;
    ptr.lastMove = performance.now();
    lastInput = ptr.lastMove;
  };
  addEventListener('pointermove',  e => onPointer(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown',  e => {
    onPointer(e.clientX, e.clientY);
    // Reduced motion gets no shock: it is the largest single movement in the
    // whole field and the one least defensible to somebody who asked for less.
    if (REDUCED || !camera) return;
    rc.setFromCamera(ptr.ndc, camera);
    ray.copy(rc.ray);
    ray.at(camera.position.length(), shock.origin);
    shock.t = 0;
    shock.amp = 1;
  }, { passive: true });
  addEventListener('pointerleave', () => { ptr.active = false; }, { passive: true });
  addEventListener('keydown', () => { lastInput = performance.now(); }, { passive: true });

  let tiltX = 0, tiltY = 0;
  if (COARSE && 'DeviceOrientationEvent' in window) {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
      tiltY = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 45));
    }, { passive: true });
  }

  /* ── instruments ──────────────────────────────────────────────────
     composer.render() only QUEUES work, so timing around it measures CPU
     submit (~0.0ms) and would make the stat a lie. The honest number is
     GPU time via a timer query; where unavailable the cell shows an em
     dash and the governor falls back to frame interval. */
  function Ring(n) {
    const buf = new Float32Array(n);
    let i = 0, fill = 0;
    return {
      push(v) { buf[i % n] = v; i++; fill = Math.min(n, fill + 1); },
      fill: () => fill,
      q(p) {
        if (fill < 12) return NaN;
        const a = buf.slice(0, fill).sort();
        return a[Math.min(fill - 1, (fill * p) | 0)];
      },
    };
  }
  const gpuRing = Ring(120), ivRing = Ring(120);
  let fpsEma = 60;

  const gl = renderer.getContext();
  const tqExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const gpuTimerOK = !!tqExt;
  const qFree = [], qBusy = [];
  const gpuBegin = () => {
    if (!gpuTimerOK || qBusy.length > 8) return null;
    const q = qFree.pop() || gl.createQuery();
    gl.beginQuery(tqExt.TIME_ELAPSED_EXT, q);
    return q;
  };
  const gpuEnd = (q) => { if (q) { gl.endQuery(tqExt.TIME_ELAPSED_EXT); qBusy.push(q); } };
  function gpuDrain() {
    if (!gpuTimerOK) return;
    const disjoint = gl.getParameter(tqExt.GPU_DISJOINT_EXT);
    while (qBusy.length) {
      const q = qBusy[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      qBusy.shift();
      if (!disjoint) gpuRing.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      qFree.push(q);
    }
  }
  const medianMs = () => gpuRing.q(0.5);

  /* ── governor: measured, hysteretic, wired to the visible numbers ── */
  const GOV = { rung: 0, over: 0, under: 0, maxRung: 0 };
  function stepDown() {
    GOV.rung++; GOV.maxRung = Math.max(GOV.maxRung, GOV.rung);
    if (GOV.rung === 1) { bloomOn = false; bloom.enabled = false; }
    else if (GOV.rung === 2) { dprScale = 0.8; applySize(); }
    else if (GOV.rung === 3) {
      buildSim(Math.max(14400, Math.round(COUNT * 0.6)));
      if (typeof cfg.onCount === 'function') cfg.onCount(COUNT, true);
      applySize();
    } else if (GOV.rung === 4) uSim.uOctaves.value = 1.0;
    console.info('[ZYRN] governor ↓ rung', GOV.rung, '→', COUNT, 'particles');
  }
  function stepUp() {
    const r = GOV.rung;
    GOV.rung--;
    if (r === 4) uSim.uOctaves.value = 3.0;
    else if (r === 2) { dprScale = 1.0; applySize(); }
    else if (r === 1) { bloomOn = true; bloom.enabled = true; }
    else GOV.rung = r;                  // rung 3 (count) is never stepped back up
    console.info('[ZYRN] governor ↑ rung', GOV.rung);
  }
  function governor(dt) {
    let hot, cool;
    if (gpuTimerOK) {
      const m = medianMs();
      if (!Number.isFinite(m)) return;
      hot = m > 9.5; cool = m < 6.5;
    } else {
      const iv = ivRing.q(0.5);
      if (!Number.isFinite(iv)) return;
      hot = iv > 20.0; cool = iv < 17.6;
    }
    GOV.over  = hot  ? GOV.over + 1 : 0;
    GOV.under = cool ? GOV.under + dt : 0;
    if (GOV.over >= 90 && GOV.rung < 4) { stepDown(); GOV.over = 0; }
    else if (GOV.under >= 10 && GOV.rung > 0 && GOV.rung <= GOV.maxRung) { stepUp(); GOV.under = 0; }
  }

  /* ── cold start: fonts + a real settle, not a guess ───────────────── */
  let fontsReady = false, coldStart = NaN, peakSpeed = 0, frames = 0;
  let readbackOK = true;
  const rbBuf = new Float32Array(16 * 16 * 4);
  document.fonts.ready.then(() => { fontsReady = true; });

  function meanSpeedSample() {
    if (!readbackOK) return NaN;
    try {
      renderer.readRenderTargetPixels(gpu.getCurrentRenderTarget(velVar), 0, 0, 16, 16, rbBuf);
      let s = 0;
      for (let i = 0; i < 256; i++) {
        const o = i * 4;
        s += Math.hypot(rbBuf[o], rbBuf[o + 1], rbBuf[o + 2]);
      }
      return s / 256;
    } catch (e) { readbackOK = false; return NaN; }
  }
  function sampleSim() {
    if (!readbackOK) return null;
    try {
      const st = stateAt(FLAGS.pin !== null ? FLAGS.pin : progress);
      const mA = uSim.uMatA.value.elements, tA = targets[st.a];
      renderer.readRenderTargetPixels(gpu.getCurrentRenderTarget(posVar), 0, 0, 16, 16, rbBuf);
      let rad = 0, maxR = 0, err = 0;
      for (let i = 0; i < 256; i++) {
        const o = i * 4;
        const d = Math.hypot(rbBuf[o], rbBuf[o + 1], rbBuf[o + 2]);
        rad += d; if (d > maxR) maxR = d;
        // readback index maps to particle (row * SIDE + col), not to i
        const q = (((i / 16) | 0) * SIDE + (i % 16)) * 4;
        const x = tA[q], y = tA[q + 1], z = tA[q + 2];
        err += Math.hypot(
          rbBuf[o]     - (mA[0] * x + mA[3] * y + mA[6] * z),
          rbBuf[o + 1] - (mA[1] * x + mA[4] * y + mA[7] * z),
          rbBuf[o + 2] - (mA[2] * x + mA[5] * y + mA[8] * z));
      }
      return {
        meanRadius: +(rad / 256).toFixed(3), maxRadius: +maxR.toFixed(3),
        meanTargetErr: +(err / 256).toFixed(3),
        meanSpeed: +(meanSpeedSample() || 0).toFixed(4),
      };
    } catch (e) { readbackOK = false; return null; }
  }

  /* ── stats strip (only where the DOM has one) ─────────────────────── */
  const el = (id) => document.getElementById(id);
  const sCount = el('sCount'), sMs = el('sMs'), sCold = el('sCold'), sFps = el('sFps');
  const pad = (n) => { const s = String(n).padStart(6, '0'); return s.slice(0, -3) + ',' + s.slice(-3); };
  if (sCount) sCount.textContent = pad(COUNT);

  /* ── debug ────────────────────────────────────────────────────────── */
  if (FLAGS.debug) {
    import('lil-gui').then(({ default: GUI }) => {
      const g = new GUI({ title: 'ZYRN / SYS.07' });
      const sim = g.addFolder('SIM');
      sim.add(uSim.uSpring,     'value', 0, 30).name('spring');
      sim.add(uSim.uDamping,    'value', 0, 20).name('damping');
      sim.add(TURB,             'base',  0, 2).name('turbulence');
      sim.add(uSim.uNoiseScale, 'value', 0.05, 2).name('noiseScale');
      sim.add(uSim.uNoiseSpeed, 'value', 0, 3).name('noiseSpeed');
      sim.add(uSim.uOvershoot,  'value', 0, 0.4).name('overshoot');
      sim.add(uSim.uStaggerW,   'value', 0, 0.95).name('staggerW')
         .onChange(v => uPts.uStaggerW.value = v);
      sim.add(uSim.uOctaves,    'value', 1, 3, 1).name('octaves');
      const pt = g.addFolder('POINTER');
      pt.add(uSim.uPointerRadius, 'value', 0.1, 3).name('radius');
      pt.add(uSim.uRepel,  'value', 0, 80).name('repel');
      pt.add(uSim.uVortex, 'value', 0, 60).name('vortex');
      pt.add(uSim.uShockSpeed, 'value', 0.5, 9).name('shock speed');
      pt.add(uSim.uShockWidth, 'value', 0.1, 2).name('shock width');
      pt.add(posVar.material.uniforms.uHeatGain, 'value', 0, 8).name('heat gain');
      pt.add(posVar.material.uniforms.uHeatDecay, 'value', 0.2, 6).name('heat decay');
      pt.add(uPts.uHeatRamp, 'value', 0, 1).name('heat ramp');
      pt.add(uPts.uHeatGlow, 'value', 0, 2.5).name('heat glow');
      pt.add(uPts.uHeatSize, 'value', 0, 2.5).name('heat size');
      const cl = g.addFolder('COLOUR');
      ['uRamp0','uRamp1','uRamp2','uRamp3'].forEach(k =>
        cl.addColor({ c: '#' + uPts[k].value.getHexString() }, 'c').name(k)
          .onChange(v => uPts[k].value.set(v)));
      cl.add(uPts.uRampPos.value, 'x', 0, 1).name('rampPos.x');
      cl.add(uPts.uRampPos.value, 'y', 0, 1).name('rampPos.y');
      cl.add(uPts.uAlpha,   'value', 0, 2).name('alpha');
      cl.add(uPts.uSize,    'value', 0.1, 4).name('size');
      cl.add(uPts.uMaxSize, 'value', 2, 128).name('maxSize');
      const df = g.addFolder('DOF');
      df.add(uPts.uDofSpread, 'value', 0, 1).name('spread');
      df.add(uPts.uDofFade,   'value', 0, 1).name('fade');
      const po = g.addFolder('POST');
      po.add(bloom, 'strength', 0, 1.2);
      po.add(bloom, 'radius', 0, 1.5);
      po.add(bloom, 'threshold', 0, 1);
      po.add({ on: true }, 'on').name('bloom').onChange(v => { bloom.enabled = v; bloomOn = v; });
      g.close();
    }).catch(() => console.warn('[ZYRN] lil-gui unavailable'));
  }

  /* ── loop ─────────────────────────────────────────────────────────── */
  const CAPTURE = !!FLAGS.freeze || FLAGS.pin !== null;
  const LEAVE = { form: null, m: 0 };
  const smoothstep01 = (x) => x * x * (3 - 2 * x);
  let frozen = false, capSteps = 0, probeFired = false;
  let last = performance.now(), simTime = 0, rafId = 0, running = true;
  let paraX = 0, paraY = 0;
  const camTarget = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), m4b = new THREE.Matrix4();

  function formMatrix(out, key, time) {
    const f = FORM[key];
    m4.makeRotationX(f.tilt);
    m4b.makeRotationZ(time * f.rate);
    m4.multiply(m4b);
    out.setFromMatrix4(m4);
  }
  function freezeState() {
    const k = ORDER.includes(String(FLAGS.freeze).toUpperCase())
      ? String(FLAGS.freeze).toUpperCase() : 'S1';
    return { a: k, b: k, m: 0 };
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (lenis) lenis.raf(now);

    const dtRaw = (now - last) / 1000;
    last = now;
    const dt = Math.min(dtRaw, 1 / 30);
    if (!frozen) simTime += dt;

    /* presence: pointer speed, dwell, idle */
    const sp = ptr.ndc.distanceTo(ptr.prev) / Math.max(dt, 1e-3);
    ptr.speed += (sp - ptr.speed) * Math.min(1, dt * 12);
    ptr.prev.copy(ptr.ndc);

    const still = (now - ptr.lastMove) > 700;
    const wantMode = (still && ptr.active && !REDUCED) ? -1 : 1;
    if (wantMode < ptr.mode) ptr.mode = Math.max(-1, ptr.mode - dt / 0.4 * 2);
    else if (ptr.mode < 1)   ptr.mode = Math.min(1, ptr.mode + dt / 0.3 * 2);
    const releasing = wantMode > 0 && ptr.mode > 0 && ptr.mode < 1;

    const idle = Math.min(1, Math.max(0, ((now - lastInput) / 1000 - 12) / 3));

    const sv = Math.max(-1, Math.min(1, scrollVel / 40));
    scrollVelSm += (sv - scrollVelSm) * Math.min(1, dt * 6);
    const svAbs = Math.abs(scrollVelSm);

    /* formation state */
    const p  = FLAGS.freeze ? parseFloat(Q.get('mix') || '1')
             : (FLAGS.pin !== null ? FLAGS.pin : progress);
    let st = FLAGS.freeze ? freezeState() : stateAt(p);

    /* leaving for another page: drive the field to whatever that page opens
       on, overriding the scroll program for the length of the transition */
    if (LEAVE.form) {
      LEAVE.m = Math.min(1, LEAVE.m + dt / 0.42);
      st = { a: st.a, b: LEAVE.form, m: LEAVE.m < 1 ? smoothstep01(LEAVE.m) : 1 };
    }

    uSim.uTargetA.value = targetTex[st.a];
    uSim.uTargetB.value = targetTex[st.b];
    uPts.uTargetA.value = targetTex[st.a];
    uPts.uTargetB.value = targetTex[st.b];
    uSim.uMix.value = st.m;
    uPts.uMix.value = st.m;

    formMatrix(uSim.uMatA.value, st.a, simTime);
    formMatrix(uSim.uMatB.value, st.b, simTime);

    /* per-segment character, derived from the pair rather than hard-coded
       to one page's program */
    const mm = st.m;
    let turb = TURB.base, spring = 9.0, grav = 0, gAlpha = 1, size = 1.0;
    // entropy is dimmer than order — but that reads as an argument only
    // where there is something to contrast against. A page that OPENS on
    // S2 (services/ai-transformation) lifts this so its hero is not murk;
    // axes.html drops it, because S2 is the ground under a pinned
    // instrument made of 8px mono and the default is loud enough to eat it.
    //
    // The two TRANSITION branches interpolate to and from this value
    // rather than a literal 0.65. They used to hard-code it, so a page
    // that tuned disperseAlpha got a step change in brightness at the
    // segment boundary. At the default the arithmetic is unchanged.
    const dA = cfg.disperseAlpha ?? 0.65;
    if (st.b === 'S2' && st.a !== 'S2') {              // coming apart
      turb  = TURB.base * (1 + (REDUCED ? 0 : 2.2) * Math.sin(Math.PI * mm));
      gAlpha = 1 - (1 - dA) * mm;
    } else if (st.a === 'S2' && st.b !== 'S2') {       // gathering
      spring = 9.0 * (1 + 0.15 * Math.sin(Math.PI * mm));
      gAlpha = dA + (1 - dA) * mm;
    } else if (st.a === 'S2' && st.b === 'S2') {
      gAlpha = dA;
    } else if (st.a === 'S3' && st.b === 'S3') {       // the loop, breathing
      // the ring wants a soft, spraying outer edge rather than a clean tube
      turb = TURB.base * (1.55 + 1.1 * svAbs);
    } else if (st.b === 'S4' && st.a !== 'S4') {       // release
      grav = 0.35 * mm;
      size = 1 - 0.16 * mm;
      turb = TURB.base * (1 - 0.4 * mm);
    }
    turb *= (REDUCED ? 0.35 : 1) * (1 - 0.4 * idle);
    uSim.uTurbulence.value = turb + (REDUCED ? 0 : 0.5 * svAbs);
    uSim.uSpring.value     = spring;
    uSim.uGravity.value    = grav;
    uSim.uOvershoot.value  = REDUCED ? 0 : 0.06;
    uPts.uGlobalAlpha.value = gAlpha;
    // moving fast pulls the ramp breakpoints down, so more of the field sits
    // on the hot stops — the colour itself reacts to scroll, not just the shape
    if (!REDUCED) {
      const shift = 0.085 * svAbs;
      uPts.uRampPos.value.set(
        Math.max(0.10, RAMP_POS[0] - shift),
        Math.max(0.30, RAMP_POS[1] - shift * 0.85),
        RAMP_POS[2],
      );
    }

    /* the shock: advance, decay, hand to both passes */
    if (shock.amp > 0.0005) {
      shock.t += dt;
      shock.amp = Math.max(0, shock.amp - dt / SHOCK_LIFE);
      uSim.uShockOrigin.value.copy(shock.origin);
      uSim.uShockT.value = shock.t;
      // squared so the impulse dies faster than the glow it leaves behind
      uSim.uShockAmp.value = shock.amp * shock.amp * 21;
      posVar.material.uniforms.uShockHeat.value = shock.amp;
    } else if (uSim.uShockAmp.value !== 0) {
      uSim.uShockAmp.value = 0;
      posVar.material.uniforms.uShockHeat.value = 0;
    }

    /* pointer ray → sim */
    if (ptr.active && !REDUCED) {
      rc.setFromCamera(ptr.ndc, camera);
      ray.copy(rc.ray);
      uSim.uRayOrigin.value.copy(ray.origin);
      uSim.uRayDir.value.copy(ray.direction);
      uSim.uPointerOn.value = 1;
      uSim.uPointerMode.value = ptr.mode;

      const gain = Math.max(0.25, Math.min(3.0, 0.25 + ptr.speed * 1.6));
      uSim.uPointerGain.value = gain * (releasing ? 1.8 : 1.0);

      const dwellAmt = Math.max(0, -ptr.mode);
      const pulse = 1 + 0.18 * Math.sin(now / 1000 * TAU / 2.4);
      uSim.uPointerRadius.value = 0.9 * (dwellAmt > 0 ? pulse : 1);
      uPts.uDwellGlow.value += (dwellAmt - uPts.uDwellGlow.value) * Math.min(1, dt * 5);
      uPts.uDwellRadius.value = uSim.uPointerRadius.value;
      ray.at(camera.position.length(), uPts.uDwellPoint.value);
    } else {
      uSim.uPointerOn.value = 0;
      uPts.uDwellGlow.value += (0 - uPts.uDwellGlow.value) * Math.min(1, dt * 5);
    }

    /* camera: dolly, tilt, damped parallax, velocity roll */
    const tx = REDUCED ? 0 : (ptr.ndc.x + tiltX * 0.5);
    const ty = REDUCED ? 0 : (ptr.ndc.y + tiltY * 0.5);
    paraX += (tx - paraX) * Math.min(1, dt * 3.2);
    paraY += (ty - paraY) * Math.min(1, dt * 3.2);
    const breathe = REDUCED ? 0 : Math.sin(simTime * TAU / 18) * 0.015 * idle;
    // transit peaks mid-morph and is exactly 0 on a settled formation, so the
    // camera pulls back to take in a change and closes on the result
    const transit = st.a === st.b ? 0 : Math.sin(Math.PI * st.m);
    let dolly = 6.55 + 1.45 * transit + 0.40 * p;

    /* Fit the formation to the NARROW axis of the viewport.
       The framing was tuned on a landscape window, where height is the
       constraint. On a portrait phone (390x844, aspect 0.46) the visible
       half-width collapses to about 1.2 world units while the torus is 2.0
       across — so the ring extended past both edges and the visitor was
       looking at the inside of it, which reads as featureless dust rather
       than as the mark of the brand. Pulling back until the narrow axis
       contains FIT puts the whole shape on screen at any aspect, and is a
       no-op on desktop where the base dolly is already further than this. */
    const tanHalf = Math.tan(camera.fov * Math.PI / 360);
    const narrow = Math.min(1, camera.aspect);
    const base = dolly;
    dolly = Math.min(24, Math.max(dolly, 2.35 / (tanHalf * Math.max(0.28, narrow))));
    // Point size falls off as 1/distance, so the pull-back above would halve
    // the particles and make the field dustier — the exact problem it is
    // meant to solve. Compensate for the ASPECT term only; the transit dolly
    // still reads as depth, and desktop is untouched (fitComp === 1 there).
    const fitComp = dolly / base;
    camera.position.set(
      paraX * 0.23,
      -0.10 + 0.48 * p + paraY * 0.16,
      dolly * (1 + breathe),
    );
    camTarget.set(0, 0.06 * p, 0);
    camera.lookAt(camTarget);
    if (!REDUCED) camera.rotateZ(scrollVelSm * 0.0105);        // +-0.6 degrees
    uPts.uFocal.value = camera.position.distanceTo(camTarget) - 0.3;
    uPts.uSize.value = size * fitComp;

    bgMat.uniforms.uTime.value = simTime;
    uSim.uTime.value = simTime;
    uPts.uTime.value = simTime;          // stateless twinkle rides this

    /* Capture mode steps on a FIXED dt with many substeps per rendered
       frame. Headless runs a page at roughly one frame per second of
       virtual time, so a real-time sim would still be mid-flight when the
       screenshot lands. This converges in ~20 rendered frames. */
    if (CAPTURE) {
      const FIXED = 1 / 60, TOTAL = 420, SUB = 24;
      uSim.uDt.value = FIXED;
      posVar.material.uniforms.uDt.value = FIXED;
      for (let i = 0; i < SUB && capSteps < TOTAL; i++) {
        uSim.uTime.value = capSteps * FIXED;
        gpu.compute();
        capSteps++;
      }
      if (capSteps >= TOTAL) frozen = true;
    } else {
      uSim.uDt.value = dt;
      posVar.material.uniforms.uDt.value = dt;
      gpu.compute();
    }

    uPts.uPos.value = gpu.getCurrentRenderTarget(posVar).texture;
    uPts.uVel.value = gpu.getCurrentRenderTarget(velVar).texture;

    if (frames % 3 === 0) measureRects();

    gpuDrain();
    const gq = gpuBegin();
    composer.render();
    gpuEnd(gq);

    ivRing.push(dtRaw * 1000);
    frames++;
    fpsEma += (1 / Math.max(dtRaw, 1e-3) - fpsEma) * 0.08;
    if (!CAPTURE) governor(dt);

    /* cold start */
    if (Number.isNaN(coldStart) && frames % 6 === 0) {
      const s = meanSpeedSample();
      if (Number.isFinite(s)) {
        // settle = mean speed has fallen to 8% of the peak this load reached,
        // not to a fixed threshold a fast machine hits at a different moment
        if (s > peakSpeed) peakSpeed = s;
        if (fontsReady && peakSpeed > 0.1 && s < Math.max(0.06, peakSpeed * 0.08) && frames > 24) {
          coldStart = (performance.now() - T0) / 1000;
        }
      } else if (fontsReady && frames > 45) {
        coldStart = (performance.now() - T0) / 1000;
      }
    }

    /* readouts */
    if (frames % 10 === 0 || frames === 2) {
      if (sMs)   { const m = medianMs(); sMs.textContent = Number.isFinite(m) ? m.toFixed(1) : '—'; }
      if (sFps)  sFps.textContent  = String(Math.round(fpsEma)).padStart(2, '0');
      if (sCold) sCold.textContent = Number.isFinite(coldStart) ? coldStart.toFixed(1) : '—';
      if (typeof cfg.onState === 'function') cfg.onState(p, stateName(st));
    }

    if (FLAGS.probe && (frames === FLAGS.probeAt || (CAPTURE && frozen && frames % 40 === 0 && !probeFired))) {
      probeFired = true;
      const m = medianMs();
      console.log('[ZYRN PROBE] ' + JSON.stringify({
        page: location.pathname.split('/').pop() || 'index.html',
        count: COUNT, medianMs: Number.isFinite(m) ? +m.toFixed(2) : null,
        p95Ms: +gpuRing.q(0.95).toFixed(2) || null,
        fps: Math.round(fpsEma), gpuTimer: gpuTimerOK, gpuSamples: gpuRing.fill(),
        medianIntervalMs: +ivRing.q(0.5).toFixed(2),
        coldStartS: Number.isFinite(coldStart) ? +coldStart.toFixed(2) : null,
        governorRung: GOV.rung, dpr: +dpr().toFixed(2), bloom: bloomOn,
        reduced: REDUCED, coarse: COARSE, state: stateName(st),
        sim: sampleSim(),
        renderer: (() => {
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
        })(),
      }));
      document.title = 'PROBE OK — ' + COUNT +
        (Number.isFinite(m) ? ' @ ' + m.toFixed(1) + 'ms' : ' (no gpu timer)');
    }
  }

  /* park while hidden, and reset the clock so a restored tab does not
     resume with a forty-second delta */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); running = false; }
    else if (!running) { running = true; last = performance.now(); rafId = requestAnimationFrame(frame); }
  });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(rafId);
    document.body.classList.add('is-flat');
    if (typeof cfg.onFlat === 'function') cfg.onFlat();
  });

  /* ── continuity: hand the field to the next page ─────────────────── */
  if (!CAPTURE) {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:)/i.test(href)) return;
      if (a.host && a.host !== location.host) return;
      const form = routeFor(href);
      if (!form) return;                       // not a field page — let it navigate

      e.preventDefault();
      LEAVE.form = form; LEAVE.m = 0;
      document.body.classList.add('is-leaving');
      try {
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ form, t: Date.now() }));
      } catch (err) { /* private mode — the intro just plays instead */ }
      setTimeout(() => { location.href = a.href; }, REDUCED ? 0 : 430);
    });

    // restored from bfcache with the veil still up
    addEventListener('pageshow', (e) => {
      if (e.persisted) {
        document.body.classList.remove('is-leaving');
        LEAVE.form = null; LEAVE.m = 0;
      }
    });
  }

  rafId = requestAnimationFrame(frame);
  // a definitive "the bed is live" signal — CSS can key off it, and it is the
  // only reliable thing to wait on when testing, since boot() is async
  document.body.classList.add('is-field-ready');
  // a read-only handle for verification; only under ?debug so the default
  // path exposes nothing
  if (FLAGS.debug) window.__zyrn = { camera, uPts, uSim, get count() { return COUNT; } };
  console.info('[ZYRN] SYS.07 field —', COUNT, 'particles, dpr', dpr().toFixed(2),
               HANDOFF ? '(entered on ' + ENTER_FORM + ')' : '');

  return {
    get count() { return COUNT; },
    refreshKeepout() { keepEls = [...document.querySelectorAll(keepSel)]; measureRects(); },
  };
}
