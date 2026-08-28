import { useEffect, useState } from 'react';
import type { TextureSource } from './textures';

/** Resolve a file in /public against the configured base path. */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Texture generation is heavy enough to drop frames if several sections kick
 * off at once, so jobs run one at a time, on idle.
 */
let queue: Promise<unknown> = Promise.resolve();

function schedule<T>(job: () => T): Promise<T> {
  const run = queue.then(
    () =>
      new Promise<T>((resolve) => {
        const go = () => resolve(job());
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(go, { timeout: 1500 });
        } else {
          setTimeout(go, 0);
        }
      }),
  );
  queue = run.catch(() => undefined);
  return run;
}

/**
 * Load a background: the real photograph if it has been dropped into /public,
 * otherwise a procedurally generated stand-in.
 */
export function loadTexture(
  file: string,
  make: () => HTMLCanvasElement,
): Promise<TextureSource> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => void schedule(make).then(resolve);
    img.src = asset(file);
  });
}

/** Same resolution, but handed back as a URL for `<img src>`. */
export function useBackdrop(file: string, make: () => HTMLCanvasElement): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    const url = asset(file);

    const probe = new Image();
    probe.onload = () => {
      if (alive) setSrc(url);
    };
    probe.onerror = () => {
      if (!alive) return;
      void schedule(make).then((canvas) => {
        if (!alive) return;
        canvas.toBlob(
          (blob) => {
            if (!alive) return;
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setSrc(objectUrl);
            } else {
              setSrc(canvas.toDataURL('image/jpeg', 0.86));
            }
          },
          'image/jpeg',
          0.86,
        );
      });
    };
    probe.src = url;

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, make]);

  return src;
}
