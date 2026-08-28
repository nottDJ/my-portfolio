# Cinematic portfolio — DIVIJ

A single-page cinematic site built on the "Aether" landing-page spec, rewritten as a
personal portfolio. React + Vite + TypeScript + Tailwind CSS v4, Framer Motion,
lucide-react. Pure black, Instrument Serif italic headings, Barlow body.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview
```

## Backgrounds

No photographs shipped with this build, so every section backdrop is **generated at
runtime on a canvas** — a golden-hour tulip meadow for the hero, drifting mist, a
misty lake below a treeline, and a dark mineral texture. They are seeded, so the
output is identical on every reload.

Each one prefers a real photograph if you provide it. Drop any of these into
`public/` and it is used automatically, no code change:

| File                     | Section        | Wants                                                |
| ------------------------ | -------------- | ---------------------------------------------------- |
| `public/hero-bg.jpg`     | Hero           | Flower meadow, wide sky, **horizon ~38% down** ¹      |
| `public/intro-bg.jpg`    | About          | Any wide nature or abstract texture                  |
| `public/section3-bg.jpg` | How I Work     | Wide cinematic scene (misty lake, forest)            |
| `public/features-bg.jpg` | Capabilities   | Dark, moody texture                                  |

¹ The hero shader splits the frame at the horizon: below it, flower clusters sway on
multi-frequency wind gusts with amplitude scaling by depth; above it, the sky creeps
through a slow radial zoom from top-centre. If your photo's horizon sits somewhere
else, change `HERO_SKYLINE` in `src/lib/textures.ts` (measured **up from the bottom
edge**, so `0.62` means the horizon is 38% down the frame).

## Editing copy

All text lives in [`src/lib/profile.ts`](src/lib/profile.ts) — name, role, email,
socials, nav links, and every section's badge, heading, and body. The components read
from it and hard-code nothing, so a rebrand is one file.

The contact form posts to the same Formspree endpoint as the old site
(`profile.formspree`), submitted over `fetch` so the page never navigates away.

## Structure

```
src/
  components/
    PageLoader        black sheet that dissolves off at 2.2s
    Navbar            fixed liquid-glass pill, shadow deepens past 30px scroll
    HeroSection       full-viewport scene + parallax content
      SwayCanvas      WebGL meadow; strip-based Canvas 2D fallback
      AtmosphereCanvas  200 drifting motes
      ParticleCanvas    60 pollen grains at the flower tips
      ParticleTitle     heading assembled from sampled text pixels, cursor-repelled
    IntroSection      "About Me"
    ProcessSection    "How I Work" — Ken Burns backdrop
    CapabilitiesSection / ProjectsSection   glass card grids
    ContactSection    CTA + Formspree form
    Footer            brand, socials, copyright
  lib/
    textures.ts   the four procedural scene generators
    backdrop.ts   photo-or-generated resolution, idle-queued
    profile.ts    all copy
    motion.ts     the shared fadeUp variant
    sprite.ts     pre-rendered glow dot shared by the particle layers
```

## Notes

- `vite.config.ts` sets `base: './'`, so `dist/` works from any sub-path — including
  GitHub Pages at `/my-portfolio/aether/`.
- `public/resume.pdf` and `public/favicon.png` are copies of the repo-root
  `resume.pdf` and `assets/images/dj.png`. Re-copy them if the originals change.
- Everything honours `prefers-reduced-motion`: canvases render a single static frame,
  the Ken Burns push holds still, and smooth scrolling is disabled.
