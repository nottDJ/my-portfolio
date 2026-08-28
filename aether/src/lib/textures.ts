/**
 * Procedural scene generation.
 *
 * The page prefers real photographs dropped into /public — `hero-bg.jpg`,
 * `intro-bg.jpg`, `section3-bg.jpg`, `features-bg.jpg`. When one is missing we
 * synthesise an equivalent scene on a canvas instead, so the site reads as
 * finished with zero assets and upgrades itself the moment a file appears.
 *
 * Every generator is seeded, so the output is byte-stable across reloads.
 */
import { clamp, hexToRgb, lerp, mixHex, mulberry32, smoothstep } from './rng';

export type TextureSource = HTMLImageElement | HTMLCanvasElement;

function surface(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

/* ------------------------------------------------------------------ */
/* fractal value noise                                                 */
/* ------------------------------------------------------------------ */

/**
 * fBm value noise sampled onto a `w × h` Float32Array in 0..1.
 * `stretch` squashes the lattice horizontally, which is what turns generic
 * noise into mist banding.
 */
function fbm(
  w: number,
  h: number,
  seed: number,
  { cells = 4, octaves = 5, gain = 0.5, stretch = 1 } = {},
) {
  const out = new Float32Array(w * h);
  let amp = 1;
  let norm = 0;

  for (let o = 0; o < octaves; o++) {
    const cx = Math.max(2, Math.round(cells * 2 ** o * stretch));
    const cy = Math.max(2, Math.round(cells * 2 ** o));
    const rnd = mulberry32(seed + o * 7919);
    const lat = new Float32Array((cx + 1) * (cy + 1));
    for (let i = 0; i < lat.length; i++) lat[i] = rnd();

    for (let y = 0; y < h; y++) {
      const gy = (y / h) * cy;
      const y0 = Math.floor(gy);
      const ty = smoothstep(gy - y0);
      const row0 = y0 * (cx + 1);
      const row1 = (y0 + 1) * (cx + 1);

      for (let x = 0; x < w; x++) {
        const gx = (x / w) * cx;
        const x0 = Math.floor(gx);
        const tx = smoothstep(gx - x0);

        const a = lat[row0 + x0];
        const b = lat[row0 + x0 + 1];
        const c = lat[row1 + x0];
        const d = lat[row1 + x0 + 1];

        out[y * w + x] += lerp(lerp(a, b, tx), lerp(c, d, tx), ty) * amp;
      }
    }

    norm += amp;
    amp *= gain;
  }

  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

/** Paint an fBm field through a colour ramp onto a small canvas. */
function noiseLayer(
  w: number,
  h: number,
  seed: number,
  ramp: (n: number, x: number, y: number) => [number, number, number, number],
  opts?: Parameters<typeof fbm>[3],
) {
  const { canvas, ctx } = surface(w, h);
  const field = fbm(w, h, seed, opts);
  const img = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const [r, g, b, a] = ramp(field[i], x / w, y / h);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ------------------------------------------------------------------ */
/* shared painting helpers                                             */
/* ------------------------------------------------------------------ */

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.62) {
  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.18,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.78,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.62, `rgba(0,0,0,${strength * 0.35})`);
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function radial(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stops: [number, string][],
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [pos, col] of stops) g.addColorStop(pos, col);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function verticalRamp(
  ctx: CanvasRenderingContext2D,
  w: number,
  y0: number,
  y1: number,
  stops: [number, string][],
) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [pos, col] of stops) g.addColorStop(pos, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, y1 - y0);
}

/* ------------------------------------------------------------------ */
/* 1. hero — tulip meadow at golden hour                               */
/* ------------------------------------------------------------------ */

const TULIPS = [
  '#d94f3d',
  '#e8623f',
  '#f2853f',
  '#f5b23f',
  '#e04a6b',
  '#c9385a',
  '#f2e2c4',
  '#ef7fa0',
  '#b8324a',
  '#f7d774',
];

/** Horizon sits 38% down the frame — sky above, meadow filling the lower 62%. */
export const HERO_SKYLINE = 0.62; // measured up from the bottom edge

function drawCloud(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
) {
  const puffs = 8 + Math.floor(rnd() * 7);
  for (let i = 0; i < puffs; i++) {
    const px = x + (rnd() - 0.5) * w;
    const py = y + (rnd() - 0.5) * h;
    const pr = (0.2 + rnd() * 0.45) * w * 0.5;
    // Puffs above the cloud's centre catch more of the low sun.
    const lit = clamp(1 - (py - (y - h * 0.5)) / Math.max(h, 1), 0, 1);
    radial(ctx, px, py, pr, [
      [0, `rgba(${255},${lerp(214, 244, lit) | 0},${lerp(186, 226, lit) | 0},${alpha})`],
      [0.45, `rgba(240,198,180,${alpha * 0.45})`],
      [1, 'rgba(214,178,168,0)'],
    ]);
  }
}

function drawTulip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  head: string,
  stem: string,
  lean: number,
) {
  // stem — sweeps down out of the head's base
  ctx.strokeStyle = stem;
  ctx.lineWidth = Math.max(0.6, s * 0.11);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - lean * 0.35, y + s * 0.9, x - lean, y + s * 2.1);
  ctx.stroke();

  // Cupped head — narrow and upright, tapering to a point, so it reads as a
  // tulip rather than a dot.
  const w = s * 0.32;
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - w, y - s * 0.1, x - w * 1.06, y - s * 0.72, x - w * 0.34, y - s);
  ctx.bezierCurveTo(x, y - s * 1.1, x, y - s * 1.1, x + w * 0.34, y - s);
  ctx.bezierCurveTo(x + w * 1.06, y - s * 0.72, x + w, y - s * 0.1, x, y);
  ctx.fill();

  // sun-facing rim (the sun sits upper-right)
  if (s > 9) {
    ctx.fillStyle = 'rgba(255,240,204,0.26)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y - s * 0.12);
    ctx.bezierCurveTo(x + w * 0.92, y - s * 0.28, x + w * 0.72, y - s * 0.8, x + w * 0.2, y - s * 0.95);
    ctx.bezierCurveTo(x + w * 0.5, y - s * 0.7, x + w * 0.54, y - s * 0.3, x + w * 0.18, y - s * 0.12);
    ctx.fill();
  }
}

export function meadowTexture(W = 1600, H = 900): HTMLCanvasElement {
  const { canvas, ctx } = surface(W, H);
  const rnd = mulberry32(0x5eed01);
  const horizon = H * (1 - HERO_SKYLINE); // 0.38 · H

  /* ---- sky ---- */
  verticalRamp(ctx, W, 0, horizon + 2, [
    [0, '#2f4f85'],
    [0.3, '#7089b4'],
    [0.58, '#c39ba4'],
    [0.8, '#f2b581'],
    [1, '#ffe3b4'],
  ]);

  // low sun
  const sunX = W * 0.74;
  const sunY = horizon * 0.52;
  ctx.globalCompositeOperation = 'lighter';
  radial(ctx, sunX, sunY, horizon * 1.5, [
    [0, 'rgba(255,232,176,0.55)'],
    [0.22, 'rgba(255,198,116,0.28)'],
    [0.6, 'rgba(255,150,60,0.09)'],
    [1, 'rgba(255,140,40,0)'],
  ]);
  radial(ctx, sunX, sunY, horizon * 0.2, [
    [0, 'rgba(255,250,232,0.95)'],
    [0.5, 'rgba(255,226,158,0.5)'],
    [1, 'rgba(255,200,120,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  // cloud banks, thinning toward the horizon
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const cy = horizon * (0.12 + t * 0.72);
    drawCloud(
      ctx,
      rnd,
      rnd() * W,
      cy,
      W * (0.34 - t * 0.16),
      horizon * (0.2 - t * 0.13),
      0.1 + (1 - t) * 0.16,
    );
  }

  // haze stacked on the horizon line
  verticalRamp(ctx, W, horizon - H * 0.14, horizon + 2, [
    [0, 'rgba(255,214,164,0)'],
    [1, 'rgba(255,230,190,0.62)'],
  ]);

  /* ---- meadow base ---- */
  verticalRamp(ctx, W, horizon - 1, H, [
    [0, '#e0c68d'],
    [0.12, '#a3ad66'],
    [0.42, '#6d7f42'],
    [0.75, '#475629'],
    [1, '#2b3519'],
  ]);

  // Soft blend across the horizon so the two ramps never meet as a hard line.
  verticalRamp(ctx, W, horizon - H * 0.045, horizon + H * 0.07, [
    [0, 'rgba(255,228,186,0)'],
    [0.4, 'rgba(255,230,190,0.34)'],
    [1, 'rgba(255,226,182,0)'],
  ]);

  // sunlight raking across the field from the sun's side
  ctx.globalCompositeOperation = 'lighter';
  radial(ctx, sunX, horizon + H * 0.06, W * 0.55, [
    [0, 'rgba(255,206,128,0.22)'],
    [0.5, 'rgba(240,180,90,0.08)'],
    [1, 'rgba(220,160,70,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  /* ---- flowers + grass, painted far to near in three depth passes ---- */
  const ground = H - horizon;
  const PASSES = 3;
  const PER_PASS = 640;

  for (let p = 0; p < PASSES; p++) {
    for (let i = 0; i < PER_PASS; i++) {
      // depth: 0 at the horizon, 1 at the bottom edge
      const band = (p + rnd()) / PASSES;
      const d = clamp(band, 0, 1);
      const y = horizon + ground * Math.pow(d, 1.15) + (rnd() - 0.5) * ground * 0.02;
      const x = rnd() * W;
      const s = 1.4 + Math.pow(d, 1.85) * 62;
      const haze = (1 - d) * 0.72;

      // grass first so the blooms sit on top of their own patch
      if (rnd() < 0.95) {
        const len = s * (1.5 + rnd() * 1.9);
        const lean = (rnd() - 0.5) * len * 0.55;
        ctx.strokeStyle = mixHex('#5e7038', '#cbb277', haze * 0.85, 0.5 + d * 0.35);
        ctx.lineWidth = Math.max(0.5, s * 0.09);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.6);
        ctx.quadraticCurveTo(x + lean * 0.4, y - len * 0.5, x + lean, y - len);
        ctx.stroke();
      }

      const base = TULIPS[(rnd() * TULIPS.length) | 0];
      const head = mixHex(base, '#f6dcae', haze * 0.8, clamp(0.55 + d * 0.5, 0, 1));

      if (s < 4.5) {
        // far field reads as specks of colour, not shapes
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, s * 0.3), 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawTulip(
          ctx,
          x,
          y,
          s,
          head,
          mixHex('#4c6030', '#c6b783', haze * 0.7, 0.75),
          (rnd() - 0.5) * s * 0.7,
        );
      }
    }

    // atmospheric haze between passes — this is what creates real depth
    if (p < PASSES - 1) {
      verticalRamp(ctx, W, horizon - 2, H, [
        [0, `rgba(255,216,164,${0.22 - p * 0.09})`],
        [0.35, `rgba(250,200,150,${0.08 - p * 0.035})`],
        [1, 'rgba(230,180,130,0)'],
      ]);
    }
  }

  /* ---- warm bokeh drifting over the near field ---- */
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W;
    const y = horizon + ground * (0.3 + rnd() * 0.7);
    const r = 3 + rnd() * 14;
    radial(ctx, x, y, r, [
      [0, `rgba(255,238,196,${0.04 + rnd() * 0.08})`],
      [1, 'rgba(255,220,160,0)'],
    ]);
  }

  // low sun spilling along the horizon — this is what sells golden hour
  radial(ctx, sunX, horizon, W * 0.4, [
    [0, 'rgba(255,214,150,0.3)'],
    [0.45, 'rgba(255,186,110,0.1)'],
    [1, 'rgba(255,170,90,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  /* ---- grade ---- */
  ctx.globalCompositeOperation = 'soft-light';
  verticalRamp(ctx, W, 0, H, [
    [0, 'rgba(120,170,255,0.22)'],
    [0.42, 'rgba(255,206,150,0.18)'],
    [1, 'rgba(70,50,25,0.22)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, W, H, 0.36);

  return canvas;
}

/* ------------------------------------------------------------------ */
/* 2. intro — soft drifting mist                                       */
/* ------------------------------------------------------------------ */

export function mistTexture(W = 1440, H = 810): HTMLCanvasElement {
  const { canvas, ctx } = surface(W, H);

  verticalRamp(ctx, W, 0, H, [
    [0, '#0e1820'],
    [0.4, '#1d333e'],
    [0.72, '#2d4b55'],
    [1, '#132029'],
  ]);

  // Horizontally stretched fBm reads as layered mist rather than static.
  const layer = noiseLayer(
    360,
    202,
    0x11a7,
    (n, _x, y) => {
      const lift = 1 - Math.abs(y - 0.55) * 1.15;
      const v = clamp((n - 0.28) * 2.3, 0, 1) * clamp(lift, 0, 1);
      const c = mixHexToRgb('#22454f', '#c3dee0', Math.pow(v, 0.7));
      return [c[0], c[1], c[2], Math.round(Math.pow(v, 1.1) * 238)];
    },
    { cells: 3, octaves: 6, gain: 0.55, stretch: 3.2 },
  );
  ctx.drawImage(layer, 0, 0, W, H);

  // A second, cooler pass at a different seed keeps it from looking tiled.
  ctx.globalAlpha = 0.5;
  const layer2 = noiseLayer(
    360,
    202,
    0x5c31,
    (n) => {
      const v = clamp((n - 0.4) * 2.6, 0, 1);
      const c = mixHexToRgb('#2b4a5e', '#a9c2dc', v);
      return [c[0], c[1], c[2], Math.round(Math.pow(v, 1.25) * 200)];
    },
    { cells: 2, octaves: 5, gain: 0.6, stretch: 4.5 },
  );
  ctx.drawImage(layer2, 0, 0, W, H);
  ctx.globalAlpha = 1;

  // pools of light so the frame has somewhere to rest
  ctx.globalCompositeOperation = 'lighter';
  radial(ctx, W * 0.24, H * 0.38, W * 0.36, [
    [0, 'rgba(160,200,210,0.26)'],
    [1, 'rgba(120,170,190,0)'],
  ]);
  radial(ctx, W * 0.78, H * 0.66, W * 0.32, [
    [0, 'rgba(206,184,160,0.2)'],
    [1, 'rgba(180,160,140,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  vignette(ctx, W, H, 0.55);
  return canvas;
}

/* ------------------------------------------------------------------ */
/* 3. process — misty lake below a treeline                            */
/* ------------------------------------------------------------------ */

/** One noisy conifer skyline, drawn as a filled silhouette. */
function treeLine(
  ctx: CanvasRenderingContext2D,
  W: number,
  baseY: number,
  height: number,
  colour: string,
  seed: number,
  spacing: number,
) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, baseY + height);

  for (let x = -spacing; x < W + spacing; x += spacing) {
    const jitter = (rnd() - 0.5) * spacing * 0.5;
    const top = baseY - height * (0.5 + rnd() * 0.5);
    const cx = x + jitter;
    const halfW = spacing * (0.72 + rnd() * 0.55);
    // jagged conifer: down the left flank, up to the tip, down the right
    ctx.lineTo(cx - halfW, baseY);
    for (let step = 0; step < 3; step++) {
      const t = (step + 1) / 4;
      ctx.lineTo(cx - halfW * (1 - t) * 0.9, lerp(baseY, top, t));
      ctx.lineTo(cx - halfW * (1 - t) * 0.55, lerp(baseY, top, t + 0.08));
    }
    ctx.lineTo(cx, top);
    for (let step = 2; step >= 0; step--) {
      const t = (step + 1) / 4;
      ctx.lineTo(cx + halfW * (1 - t) * 0.55, lerp(baseY, top, t + 0.08));
      ctx.lineTo(cx + halfW * (1 - t) * 0.9, lerp(baseY, top, t));
    }
    ctx.lineTo(cx + halfW, baseY);
  }

  ctx.lineTo(W + spacing, baseY + height);
  ctx.closePath();
  ctx.fill();
}

export function lakeTexture(W = 1600, H = 900): HTMLCanvasElement {
  const { canvas, ctx } = surface(W, H);
  const waterLine = H * 0.58;

  /* ---- sky ---- */
  verticalRamp(ctx, W, 0, waterLine + 2, [
    [0, '#14202c'],
    [0.34, '#2b3f50'],
    [0.68, '#5c7684'],
    [0.9, '#9db1b6'],
    [1, '#d2dcda'],
  ]);

  ctx.globalCompositeOperation = 'lighter';
  radial(ctx, W * 0.36, waterLine * 0.82, W * 0.36, [
    [0, 'rgba(224,230,220,0.34)'],
    [1, 'rgba(180,200,200,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  /* ---- receding treelines, each foggier than the one in front ---- */
  const bands: [number, number, string, number, number][] = [
    [waterLine - H * 0.005, H * 0.1, 'rgba(126,146,148,0.55)', 0x7101, 34],
    [waterLine + H * 0.002, H * 0.14, 'rgba(84,104,108,0.72)', 0x7102, 46],
    [waterLine + H * 0.006, H * 0.19, 'rgba(46,60,64,0.86)', 0x7103, 62],
    [waterLine + H * 0.01, H * 0.25, 'rgba(20,28,32,0.96)', 0x7104, 84],
  ];

  for (const [y, hgt, colour, seed, spacing] of bands) {
    treeLine(ctx, W, y, hgt, colour, seed, spacing);
    // fog wedged between the layers
    verticalRamp(ctx, W, y - hgt, y + 4, [
      [0, 'rgba(190,205,205,0)'],
      [0.72, 'rgba(186,202,203,0.16)'],
      [1, 'rgba(196,210,210,0.36)'],
    ]);
  }

  /* ---- water ---- */
  verticalRamp(ctx, W, waterLine, H, [
    [0, '#b0c0bf'],
    [0.08, '#5e747a'],
    [0.4, '#2b3a41'],
    [1, '#0d141a'],
  ]);

  // reflection: the treeline mirrored, smeared and dimmed
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.translate(0, waterLine * 2);
  ctx.scale(1, -1);
  treeLine(ctx, W, waterLine + H * 0.01, H * 0.22, 'rgba(16,24,28,1)', 0x7104, 84);
  ctx.restore();

  // horizontal light streaks flatten the mirror back into water
  const rnd = mulberry32(0x9a71);
  for (let i = 0; i < 120; i++) {
    const y = waterLine + (H - waterLine) * Math.pow(rnd(), 1.5);
    const x = rnd() * W;
    const len = 30 + rnd() * 260;
    const a = 0.02 + rnd() * 0.07;
    const g = ctx.createLinearGradient(x - len / 2, 0, x + len / 2, 0);
    g.addColorStop(0, 'rgba(200,220,220,0)');
    g.addColorStop(0.5, `rgba(206,224,224,${a})`);
    g.addColorStop(1, 'rgba(200,220,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - len / 2, y, len, 1 + rnd() * 2);
  }

  /* ---- mist rolling across the whole frame ---- */
  const fog = noiseLayer(
    340,
    191,
    0x3f21,
    (n, _x, y) => {
      const band = 1 - Math.abs(y - 0.56) * 2.1;
      const v = clamp((n - 0.4) * 2.2, 0, 1) * clamp(band, 0, 1);
      return [214, 226, 226, Math.round(Math.pow(v, 1.2) * 190)];
    },
    { cells: 3, octaves: 5, gain: 0.55, stretch: 4 },
  );
  ctx.globalAlpha = 0.8;
  ctx.drawImage(fog, 0, 0, W, H);
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'soft-light';
  verticalRamp(ctx, W, 0, H, [
    [0, 'rgba(90,140,190,0.24)'],
    [0.6, 'rgba(180,200,200,0.14)'],
    [1, 'rgba(20,30,40,0.28)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';
  vignette(ctx, W, H, 0.5);

  return canvas;
}

/* ------------------------------------------------------------------ */
/* 4. capabilities — dark mineral texture                              */
/* ------------------------------------------------------------------ */

export function duskTexture(W = 1440, H = 810): HTMLCanvasElement {
  const { canvas, ctx } = surface(W, H);

  ctx.fillStyle = '#0b111a';
  ctx.fillRect(0, 0, W, H);

  const strata = noiseLayer(
    380,
    214,
    0x2b8d,
    (n) => {
      const v = clamp((n - 0.3) * 2.2, 0, 1);
      const c = mixHexToRgb('#16202e', '#94aac4', Math.pow(v, 0.72));
      return [c[0], c[1], c[2], Math.round(Math.pow(v, 1.15) * 238)];
    },
    { cells: 3, octaves: 6, gain: 0.52, stretch: 1.7 },
  );
  ctx.drawImage(strata, 0, 0, W, H);

  // a single warm ember keeps the section from going flat blue
  ctx.globalCompositeOperation = 'lighter';
  radial(ctx, W * 0.82, H * 0.24, W * 0.44, [
    [0, 'rgba(196,132,72,0.26)'],
    [0.5, 'rgba(160,104,56,0.1)'],
    [1, 'rgba(120,80,40,0)'],
  ]);
  radial(ctx, W * 0.12, H * 0.78, W * 0.38, [
    [0, 'rgba(84,132,180,0.24)'],
    [1, 'rgba(60,100,140,0)'],
  ]);
  ctx.globalCompositeOperation = 'source-over';

  vignette(ctx, W, H, 0.68);
  return canvas;
}

/* ------------------------------------------------------------------ */

/** Channel-level blend for per-pixel work — avoids the string round-trip. */
function mixHexToRgb(a: string, b: string, t: number): [number, number, number] {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const k = clamp(t, 0, 1);
  return [(lerp(r1, r2, k) + 0.5) | 0, (lerp(g1, g2, k) + 0.5) | 0, (lerp(b1, b2, k) + 0.5) | 0];
}
