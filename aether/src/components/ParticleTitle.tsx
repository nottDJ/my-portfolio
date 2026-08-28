import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/backdrop';
import { glowSprite } from '../lib/sprite';

/**
 * The hero heading, assembled from particles sampled out of a rendered text
 * mask. The cursor pushes them out of formation; springs pull them back, and
 * once settled they breathe on a slow sine so the words never look frozen.
 */

const HEIGHT = 230; // CSS px
const SPRING = 0.055;
const FRICTION = 0.8;
const REPEL_RADIUS = 110;
const REPEL_STRENGTH = 10;
const DOT = 1.7;

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  seed: number;
};

type Props = { lines: [string, string] | string[] };

function fontFor(width: number) {
  return Math.max(30, Math.min(80, width * 0.082));
}

/** Render the two lines into an offscreen mask and read back the lit pixels. */
function sampleTargets(lines: string[], width: number, step: number) {
  const mask = document.createElement('canvas');
  mask.width = Math.max(1, Math.round(width));
  mask.height = HEIGHT;
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;

  const size = fontFor(width);
  const gap = size * 0.92;

  mctx.clearRect(0, 0, mask.width, mask.height);
  mctx.fillStyle = '#fff';
  mctx.textAlign = 'center';
  mctx.textBaseline = 'middle';
  mctx.font = `italic ${size}px 'Instrument Serif', serif`;

  lines.forEach((line, i) => {
    const offset = (i - (lines.length - 1) / 2) * gap;
    mctx.fillText(line, mask.width / 2, HEIGHT / 2 + offset);
  });

  const data = mctx.getImageData(0, 0, mask.width, mask.height).data;
  const targets: [number, number][] = [];
  for (let y = 0; y < HEIGHT; y += step) {
    for (let x = 0; x < mask.width; x += step) {
      if (data[(y * mask.width + x) * 4 + 3] > 128) targets.push([x, y]);
    }
  }
  return targets;
}

export default function ParticleTitle({ lines }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprite = glowSprite();
    const still = prefersReducedMotion();

    let particles: Particle[] = [];
    let width = 0;
    let frame = 0;
    let disposed = false;
    const mouse = { x: -9999, y: -9999 };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = wrap.clientWidth || window.innerWidth;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.round(HEIGHT * dpr);
      canvas.style.height = `${HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const build = () => {
      size();

      // Sample every 3px, easing to 4px on wide viewports to keep the count sane.
      let targets = sampleTargets(lines, width, 3);
      if (targets.length > 5200) targets = sampleTargets(lines, width, 4);

      particles = targets.map(([tx, ty]) => ({
        tx,
        ty,
        // every particle flies in from above or below the canvas
        x: Math.random() * width,
        y: Math.random() < 0.5 ? -40 - Math.random() * 200 : HEIGHT + 40 + Math.random() * 200,
        vx: 0,
        vy: 0,
        seed: Math.random() * Math.PI * 2,
      }));
    };

    const drawStatic = () => {
      size();
      const fs = fontFor(width);
      const gap = fs * 0.92;
      ctx.clearRect(0, 0, width, HEIGHT);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `italic ${fs}px 'Instrument Serif', serif`;
      lines.forEach((line, i) => {
        const offset = (i - (lines.length - 1) / 2) * gap;
        ctx.fillText(line, width / 2, HEIGHT / 2 + offset);
      });
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, width, HEIGHT);
      const glowing: [number, number][] = [];

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();

      for (const p of particles) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * SPRING;
        p.vy += dy * SPRING;

        const mx = mouse.x - p.x;
        const my = mouse.y - p.y;
        const d2 = mx * mx + my * my;
        let lit = false;

        if (d2 < REPEL_RADIUS * REPEL_RADIUS) {
          const d = Math.sqrt(d2) || 0.0001;
          const force = (1 - d / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx -= (mx / d) * force;
          p.vy -= (my / d) * force;
          lit = d < REPEL_RADIUS * 0.62;
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // settled particles drift on a tiny sine so the words stay alive
        const settled = Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2;
        const bx = settled ? Math.sin(t * 0.0012 + p.seed) * 0.6 : 0;
        const by = settled ? Math.cos(t * 0.0009 + p.seed * 1.7) * 0.5 : 0;

        const px = p.x + bx;
        const py = p.y + by;

        if (lit) glowing.push([px, py]);
        ctx.rect(px, py, DOT, DOT);
      }

      ctx.fill();

      // bloom on the handful of particles under the cursor
      if (glowing.length) {
        ctx.globalAlpha = 0.5;
        for (const [gx, gy] of glowing) {
          ctx.drawImage(sprite, gx - 4, gy - 4, 8, 8);
        }
        ctx.globalAlpha = 1;
      }

      frame = requestAnimationFrame(render);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (disposed) return;
        if (still) drawStatic();
        else build();
      }, 180);
    };

    const start = () => {
      if (disposed) return;
      if (still) {
        drawStatic();
      } else {
        build();
        frame = requestAnimationFrame(render);
      }
      window.addEventListener('resize', onResize);
      if (!still) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        document.addEventListener('pointerleave', onPointerLeave);
      }
    };

    // Wait for Instrument Serif, or the mask samples a fallback face.
    const face = `italic ${fontFor(wrap.clientWidth || window.innerWidth)}px 'Instrument Serif'`;
    if (document.fonts?.load) {
      document.fonts
        .load(face)
        .then(() => document.fonts.ready)
        .then(start)
        .catch(start);
    } else {
      start();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [lines]);

  return (
    <div ref={wrapRef} style={{ width: '100%', maxWidth: 960, margin: '0 auto' }}>
      {/* The real heading, kept for screen readers and search engines. */}
      <h1
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {lines.join(' ')}
      </h1>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: 'block', width: '100%', height: HEIGHT, pointerEvents: 'none' }}
      />
    </div>
  );
}
