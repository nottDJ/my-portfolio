import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/backdrop';
import { fitCanvas, glowSprite } from '../lib/sprite';

/**
 * 60 pollen grains spawned in a narrow band at the flower tips (55–68% down
 * the frame). They lift gently and dissolve as they clear the meadow.
 */

const COUNT = 60;
const BAND_TOP = 0.55;
const BAND_BOTTOM = 0.68;

type Pollen = {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  speedX: number;
  speedY: number;
  phase: number;
  pulse: number;
};

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprite = glowSprite();
    const still = prefersReducedMotion();
    let { w, h } = fitCanvas(canvas);

    const spawnY = () => h * (BAND_TOP + Math.random() * (BAND_BOTTOM - BAND_TOP));

    const grains: Pollen[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: spawnY(),
      r: 0.1 + Math.random() * 0.7,
      baseOpacity: 0.08 + Math.random() * 0.45,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: -(0.05 + Math.random() * 0.22),
      phase: Math.random() * Math.PI * 2,
      pulse: 0.5 + Math.random() * 1.5,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const p of grains) {
        if (!still) {
          p.x += p.speedX;
          p.y += p.speedY;

          // back into the flower band once it has cleared the meadow
          if (p.y < h * 0.44) {
            p.y = spawnY();
            p.x = Math.random() * w;
          }
          if (p.x < -6) p.x = w + 6;
          else if (p.x > w + 6) p.x = -6;
        }

        // fade out across the 50–60% band as the grain rises clear
        const rel = p.y / h;
        const heightFactor = Math.max(0, Math.min(1, (rel - 0.5) / 0.1));
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.001 * p.pulse + p.phase);
        const alpha = p.baseOpacity * pulse * heightFactor;
        if (alpha <= 0.002) continue;

        const bloom = p.r * 2.2;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - bloom, p.y - bloom, bloom * 2, bloom * 2);
      }

      ctx.globalAlpha = 1;
    };

    let frame = 0;
    if (still) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      const next = fitCanvas(canvas);
      w = next.w;
      h = next.h;
      if (still) draw(0);
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  );
}
