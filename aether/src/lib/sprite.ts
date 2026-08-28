/**
 * A single pre-rendered radial dot, reused by every particle layer.
 * Building one sprite and blitting it beats creating a fresh radial gradient
 * per particle per frame by a wide margin.
 */
let sprite: HTMLCanvasElement | null = null;

export const SPRITE_SIZE = 64;

export function glowSprite(): HTMLCanvasElement {
  if (sprite) return sprite;

  const c = document.createElement('canvas');
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const ctx = c.getContext('2d')!;
  const half = SPRITE_SIZE / 2;

  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.72)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  sprite = c;
  return c;
}

/** Size a canvas to its CSS box at a capped device pixel ratio. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 1.5) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round((canvas.offsetWidth || window.innerWidth) * dpr));
  const h = Math.max(1, Math.round((canvas.offsetHeight || window.innerHeight) * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}
