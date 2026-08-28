import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/backdrop';
import { fitCanvas, glowSprite } from '../lib/sprite';

/**
 * 200 ambient motes drifting slowly upward across the whole frame, each with
 * its own twinkle rate. Wraps at every edge, so the shimmer never runs out.
 */

const COUNT = 200;

type Mote = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speedX: number;
  speedY: number;
  phase: number;
  twinkle: number;
};

export default function AtmosphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprite = glowSprite();
    const still = prefersReducedMotion();
    let { w, h } = fitCanvas(canvas);

    const motes: Mote[] = Array.from({ length: COUNT }, () => {
      // 55% of the motes sit in the upper 60% of the frame.
      const high = Math.random() < 0.55;
      return {
        x: Math.random() * w,
        y: high ? Math.random() * h * 0.6 : h * 0.6 + Math.random() * h * 0.4,
        r: 0.4 + Math.random() * 1.4,
        opacity: 0.18 + Math.random() * 0.45,
        speedX: (Math.random() - 0.5) * 0.14,
        speedY: -(0.04 + Math.random() * 0.18),
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 1.6,
      };
    });

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const m of motes) {
        if (!still) {
          m.x += m.speedX;
          m.y += m.speedY;
          if (m.y < -8) m.y = h + 8;
          if (m.x < -8) m.x = w + 8;
          else if (m.x > w + 8) m.x = -8;
        }

        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.001 * m.twinkle + m.phase);
        const bloom = m.r * 2.4;
        ctx.globalAlpha = Math.max(0, m.opacity * twinkle);
        ctx.drawImage(sprite, m.x - bloom, m.y - bloom, bloom * 2, bloom * 2);
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
