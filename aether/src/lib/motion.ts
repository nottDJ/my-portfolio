import type { Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Every section enters the same way: a short, staggered rise out of blur-black. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: (i as number) * 0.12, ease: EASE },
  }),
};

export const IN_VIEW = { once: true, margin: '-80px' } as const;
