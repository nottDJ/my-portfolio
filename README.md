# Portfolio — Divij K P

A single-page personal portfolio with a hand-drawn Japanese (和) theme: a layered
ukiyo-e backdrop that parallaxes as you scroll, and a project card for each repo
with its own hand-authored SVG illustration.

It has a day skin and a night skin (日 / 月), and the backdrop is a different
scene in each: sunrise, drifting kumo and falling sakura by day; moon, stars,
rising lanterns and fireflies after dark.

**Live:** https://nottdj.github.io/my-portfolio/

No build step, no framework, no bundler. Plain HTML, CSS and vanilla JavaScript —
open it and it runs.

---

## Running it locally

### Option 1 — a local server (recommended)

From the project root:

```bash
python -m http.server 8000
```

Then open **http://localhost:8000**.

Any static server works equally well:

```bash
npx serve .          # Node
php -S localhost:8000 # PHP
```

Or, in VS Code, install **Live Server** and hit *Go Live* — that adds auto-reload
on save, which is the nicest way to work on the theme.

Stop the server with `Ctrl+C`.

### Option 2 — just open the file

Every path in the project is relative and nothing uses `fetch`, ES modules or a
service worker, so double-clicking `index.html` genuinely works. A server is still
the better habit: it matches how GitHub Pages actually serves the site, and it
avoids `file://` quirks around PDF downloads.

### There is no build

Edit a file, refresh the browser. `server.js` in the root is an empty leftover and
is not used by anything.

---

## Deploying

The site is served by **GitHub Pages** from the repo root, so deploying is just:

```bash
git add -A
git commit -m "Update portfolio"
git push
```

Pages picks it up within a minute or two. Because links are relative, the site works
both at `/my-portfolio/` on Pages and at `/` locally — don't change them to absolute
paths, that was a bug in an earlier version.

---

## File map

| File | What it does |
| --- | --- |
| `index.html` | All markup, including the backdrop layers and the nine project SVGs |
| `style.css` | Layout, typography, components, responsive breakpoints |
| `japanese-bg.css` | The backdrop's layers **and the colour tokens the whole site reads** |
| `japanese-bg.js` | Scroll parallax + the particle canvas (sakura by day, fireflies at night) |
| `project-art.css` | Every project illustration's animation |
| `night.css` | The night skin — palette tokens, the surfaces that hard-code a light value, and the night backdrop |
| `interactive.css` | Theme toggle, reading rail, project filter, card tilt, click ripple, omikuji, return-to-top |
| `interactive.js` | The behaviour behind all of the above |
| `main.js` | Nav, typed hero text, scroll reveal, active-section highlighting |
| `resume.pdf` | Served by both "Download CV" buttons |
| `portrait.css` | The hero portrait: the round window, the breathing zoom, the light sheen, the tilt |
| `assets/images/` | `pfp.webp` (the portrait the page loads), `pfp.png` (same image, alpha PNG fallback for anything off-site), `dj.png` (favicon) |

`japanese-bg.css` must load **before** `style.css` — it defines the `--washi`,
`--sumi`, `--ai`, `--shu` … custom properties that `style.css` builds on.

---

## The Japanese backdrop

A single fixed, `pointer-events: none`, `aria-hidden` container behind the page,
built from layers back to front:

1. **空 sky** — washi paper gradient wash
2. **日の丸 sun** — vermillion disc with a slow breathing ring
3. **雲 kumo** — stylised cloud bands drifting at two speeds
4. **富士山** — two ridgelines with a snow-capped Fuji, at different parallax depths
5. **青海波 seigaiha** — a tiling wave band along the bottom
6. **麻の葉 asanoha** — a hemp-leaf lattice, barely there, as paper texture
7. **桜 sakura** — falling petals on a `<canvas>`
8. **和紙** — film grain and a soft vignette

### How the scroll effect works

`japanese-bg.js` runs **one** `requestAnimationFrame` loop that does two things:

- Eases the scroll position (framerate-independent exponential smoothing) so
  inertial and trackpad scrolling don't jitter, then publishes it as **two CSS
  custom properties** — `--jp-sy` (pixels) and `--jp-sp` (0→1 progress) — on the
  backdrop container. Each layer reads them from CSS, so the whole scene moves from
  **one style write per frame** rather than one per element.
- Steps and draws the petal simulation.

Depth is one number per layer, all together at the top of `japanese-bg.css`:

```css
--p-sun:   -0.055;   /* furthest, moves least */
--p-cloud: -0.028;
--p-far:   -0.075;
--p-near:  -0.135;
--p-wave:  -0.200;   /* nearest, moves most */
```

Make a layer feel closer by making its number more negative.

### Why it holds up on any screen

- Every layer is an SVG with `preserveAspectRatio="… slice"`, so it *fills* the
  viewport at any ratio — ultrawide crops vertically, tall phones crop
  horizontally, nothing ever letterboxes. Verified from 490 px to 2534 px wide
  with no horizontal overflow at any width.
- Petal count scales with viewport **area** and is capped harder on touch devices,
  so a 4K monitor isn't sparse and a small phone isn't swamped.
- Canvas DPR is capped at 2 — a 3× buffer costs real fill rate for shapes nobody
  inspects.
- The loop suspends entirely while the tab is hidden.
- Sizing reads the container's own box, not `window.innerWidth`, so a collapsing
  mobile URL bar doesn't cause a visible jump. `visualViewport` resize is handled
  too, which plain `resize` misses on iOS Safari.
- `prefers-reduced-motion` stops all of it — the scene stays, the movement goes.

---

## Project cards

Each card's illustration is **hand-authored inline SVG animated in pure CSS** — no
libraries, no bitmaps, no SMIL. Each was designed after reading the actual repo, so
the picture shows the real mechanism rather than a generic icon.

| # | Project | Motif | What it shows |
| --- | --- | --- | --- |
| 壱 | ArchX3D | 立体化 — kawara hip roof | A cutting plane rises through the floor plan, wireframe becomes solid wall, and a 築 seal lands when the walls top out |
| 弐 | Face Recognition | 出席印 — hanko + register | The lens locks on and a 出 seal flies into the hour row; a second sighting in the same hour sets off, fades, and is refused |
| 参 | Fake News Detection | 真偽 — ensō + ema tablets | 真 leaves in a straight line and closes itself; 偽 detonates into queries reaching three evidence tablets |
| 肆 | Smart Sluice | 水門 — seigaiha + asanoha | Inflow rises, the derived target bed sinks away from the measured one, and a gold caliper measures the silt to dredge |
| 伍 | Programmable Digital Rupee | 関所 — senbon torii | A coin clears three rule gates and the fourth slams shut, stamped 止 |
| 陸 | Predictive Network Traffic | 経路 — two candidate routes | The forecast crosses its threshold **before** the jam appears and the reroute happens **before** the jam clears — that order is the project's whole claim |
| 漆 | Civic Issue Tracker | 通報 — ward map + 正 tally | Pins drop on the map, the ward votes in 正 tally strokes, and the row with the most marks is the one stamped 済 — its pin turning green on the map at the same moment |
| 捌 | Auction Price Predictor | 値付け — balance of evidence | Each attribute supplied closes the price band inward on its own centre, in five visible steps, until a 木札 price tag drops on its cord |
| 玖 | Student Portal | 学籍 — one bound ledger | The student pages fill themselves in; the role flips to 教員, a brush corrects one mark, and the change lands on both pages at once |

Two rules the SVG animation code follows, both documented in `project-art.css`:

1. An element must never carry **both** a `transform` attribute and an animated CSS
   `transform` — the CSS one wins outright and the authored placement is silently
   lost. Where both are needed, the markup nests an outer placement `<g>` around an
   inner animated `<g>`.
2. Scaling or rotating an SVG element needs an explicit `transform-box`, or
   `transform-origin` resolves differently across browsers.

The loops run at **12 / 13 / 14 / 15 s** deliberately, so the cards never fall
into step and start pulsing as a group.

Every card also has a **hand-authored reduced-motion frame**. Simply stopping the
animations isn't enough — several elements are authored in their *pre*-animation
state (zero-length dashes, zero opacity), so the `prefers-reduced-motion` block
resolves each card to the single still frame that tells the most of its story.

---

## 日 / 月 — the night skin

Everything lives in `night.css`, keyed off `data-theme="dark"` on `<html>`.

The theme is resolved by a **small inline script in `<head>`**, above the body. It
has to be inline and it has to be there: deferred into `interactive.js` it would run
after the first paint, and a returning night-mode visitor would get a full frame of
the day palette in the face. A saved choice wins; failing that, the OS decides. The
site follows `prefers-color-scheme` only until the visitor picks for themselves —
after that, their choice outranks it.

Two rules the file follows:

1. **The page furniture inverts. The project plates do not.** They stay warm washi,
   the way woodblock prints stay paper when you turn the gallery lights down; only
   the light falling on them drops, and hovering a card turns it back up. Inverting
   them would throw away every colour relationship the art was drawn with.
2. **Nothing restyles by element.** Every rule either rewrites a palette token or
   overrides one of the handful of rules in `style.css` / `japanese-bg.css` that
   hard-code a light value.

The backdrop is genuinely a different scene, not a filtered one:

| | Day | Night |
| --- | --- | --- |
| The disc | 日の丸 sunrise, with 旭光 rays | 月, lit upper-left with the terminator falling away lower-right |
| Sky | washi paper, warm | deep indigo into near-black |
| 山 ridgelines | *darker* than the ground | *lighter* than the ground, or they vanish |
| Particles | 桜 sakura petals, falling | 蛍 fireflies, climbing |
| Extras | — | starfield, 流れ星, rising 提灯 lanterns |
| 和紙 grain | `multiply` | `overlay` — multiply over black is a no-op |

A firefly is not a petal with a different colour. A petal is driven by gravity and
reads as *falling*; a firefly has to read as *deciding* where to go, so its heading
is a slow random walk with a weak upward bias, and its brightness pulses on its own
clock. The pulse is squared so it spends most of the cycle dim and flares briefly —
a plain sine reads as a throbbing bulb.

The crossfade between skins is armed by a `theme-animating` class that
`interactive.js` removes again after 780 ms. Left on permanently, every hover in the
document would inherit a 650 ms colour transition and the whole UI would feel like
syrup.

---

## 生き写し — the hero portrait

The portrait art (`pfp.webp`) is a finished circular illustration — it draws its
own sun, its own sakura branch, its own Fuji — supplied as a square PNG with the
four corners outside the circle plain black. `assets/images/` processes that once,
offline: a 4×-supersampled circular alpha mask trims the corners to transparent
with a clean anti-aliased edge, and the result is downsized to 760×760 and saved as
both `pfp.webp` (what the page loads) and `pfp.png` (an alpha fallback for anything
off-site).

Because the art is a single finished piece rather than a cutout, it hangs in the
round window as-is — `.portrait-figure` clips it to a circle with a plain
`border-radius: 50%; overflow: hidden`, no compositing tricks needed. What
`portrait.css` adds on top is three independent, purely additive motions:

| Motion | What it does |
| --- | --- |
| 呼吸 breathe | The photo itself holds a slow ambient zoom — `scale(1)` to `scale(1.045)` over 11s — so a still image reads as alive rather than static |
| 光 sheen | A soft diagonal light crosses the glass every ~8s, clipped to the circle for free by the figure's own `overflow: hidden` |
| 傾き tilt | Fine pointers only: the disc tips toward the cursor (capped at 5°, well under the project cards' 7° — a face reads as "wrong" at an angle a flat illustration does not) with a highlight that tracks it, via `interactive.js` writing `--ptx` / `--pty` / `--pmx` / `--pmy` — the same construction as the project-card tilt, aimed at the portrait instead of a plate |

A 写 seal (as in 写真, "a copy of the truth") sits in the corner as a quiet
signature, fading in once on load rather than choreographed to anything.

**None of this depends on JavaScript to look right.** With the script absent or the
tilt disabled, the portrait is still a correctly framed, gently breathing photo in
a round window.

---

## 仕掛け — the interactive parts

All in `interactive.css` + `interactive.js`. No libraries. Every control is a real
`<button>`, keyboard reachable, and everything collapses politely under
`prefers-reduced-motion`.

| | What it does |
| --- | --- |
| **日 / 月 toggle** | In the nav. One button, two kanji, rotated through on a single axis in 3D. Persists to `localStorage`; **`t`** toggles it from the keyboard (guarded, so it never fires while you are typing in the contact form) |
| **Reading rail** | Scroll progress across the top, drawn as a brush stroke — opaque at the tail, thinning toward the head |
| **Project filter** | 全 / ML & AI / Vision & 3D / Full-stack / Data, with a live count. Cards fade out *before* they leave the flow, so the grid never reflows underneath a card still on screen |
| **Card tilt** | The plate turns under the pointer with a highlight tracking across it, so it reads as a surface catching light. Capped at 7° — past that it stops being a print and becomes a 3D object. Fine pointers only: on a touch screen a tap would set the value and it would stick |
| **水紋 click ripple** | Two offset rings wherever you click, squashed on Y so they read as rings on water seen at an angle. Suppressed over form fields — a ring blooming out of a text caret reads as an error |
| **おみくじ** | The ensō ring beside the portrait is a fortune box. Click it, the box shakes, and a slip unrolls with one of ten developer fortunes. Never the same slip twice running — drawing 大吉 twice in a row reads as broken randomness even when it isn't |
| **Portrait tilt** | The hero portrait tips toward a fine pointer with a highlight tracking across it — the same construction as the card tilt above, capped at 5° instead of 7° since a face reads as "wrong" at an angle a flat illustration does not |
| **Stat counters** | The About figures count up when they scroll into view, in tabular figures so the number doesn't jitter sideways while it runs |
| **上 return-to-top** | Appears after one viewport of scroll |

---

## Common edits

### Change the email address

It appears in **three** places in `index.html` — the hero button and two in the
contact card. Search for `mail.google.com` and update `to=` in each. The link opens
Gmail's compose view with the recipient, subject and body prefilled:

```
https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=…&su=…&body=…
```

`&` must be written as `&amp;` inside an HTML attribute.

### Swap the résumé

Replace `resume.pdf` in the root, keeping the filename. Both buttons point at it via
`<a href="resume.pdf" download="Divij_K_P_Resume.pdf">` — change the `download`
value if you want a different saved filename.

### Recolour the site

Edit the tokens at the top of `japanese-bg.css`. Everything else derives from them:

```css
--washi:  #f6f1e6;   /* 和紙 paper      */
--sumi:   #23201c;   /* 墨  ink         */
--ai:     #1b3b6f;   /* 藍  indigo      */
--shu:    #d94f3d;   /* 朱  vermillion  */
--kin:    #c9a227;   /* 金  gold leaf   */
--matcha: #6b7d5a;
--sakura: #eeb4c0;
```

### Add a project

Add an `<article>` to `.project-container` in `index.html`. The grid is
`repeat(auto-fit, minmax(310px, 1fr))`, so it reflows on its own:

```html
<article class="project-box">
  <div class="project-art">
    <svg viewBox="0 0 400 260" role="img" aria-label="…" focusable="false">…</svg>
    <span class="plate-kanji" aria-hidden="true">漢字</span>
    <span class="plate-no" aria-hidden="true">陸</span>
  </div>
  <div class="project-body">
    <h3>Project name</h3>
    <p class="project-jp" aria-hidden="true">日本語の副題</p>
    <p>What it does and how it actually works.</p>
    <div class="project-tags"><span>Python</span></div>
    <div class="project-links">
      <a href="https://github.com/…" target="_blank" rel="noopener">
        <i class="uil uil-github-alt"></i> Code</a>
      <a class="live" href="https://…" target="_blank" rel="noopener">
        <i class="uil uil-external-link-alt"></i> Live demo</a>
    </div>
  </div>
</article>
```

If the SVG uses `<pattern>`, `<clipPath>` or `<mask>`, **prefix every `id`** with
something card-specific. Every SVG on the page shares one document, so a duplicate
id silently breaks whichever element references it second. The existing cards use
the prefixes `a3d` `fr` `fn` `ss` `dr` `nt` `cv` `ap` `sp`.

Give the card a `data-tags` attribute too, or the project filter will only ever show
it under **All**. The recognised values are `ml`, `vision`, `fullstack` and `data`;
a card may carry several, space-separated.

### Change the hero text

The rotating phrases are the `strings` array in `main.js`. Keep them short — the
hero headline is `clamp(30px, 4.2vw, 48px)` and long phrases wrap awkwardly.

---

## Accessibility & performance notes

- The whole backdrop is `aria-hidden`, as is every decorative kanji, so a screen
  reader gets the content and none of the scenery.
- Each project illustration carries `role="img"` and a descriptive `aria-label`.
- Mobile nav is keyboard operable (Enter/Space to toggle, Escape to close) and
  reports `aria-expanded`.
- Every `target="_blank"` link carries `rel="noopener"`.
- The theme toggle is a real `<button>` carrying `aria-pressed` and an `aria-label`
  that says what pressing it will do, not what state it is in.
- The filter's result count is `aria-live="polite"`, so a filter change is announced
  rather than only shown.
- The omikuji is a `role="dialog"` with `aria-modal`, closes on Escape or a click on
  the backdrop, and returns focus to the ensō it was opened from.
- Scroll listeners are all `{ passive: true }`.
- Left/right scroll reveals are gated to ≥ 901 px. Below that the layout is a single
  stacked column, where ScrollReveal's pre-reveal `translateX` used to push content
  60 px past the viewport edge.

External dependencies, all from CDNs: Google Fonts (Poppins + Shippori Mincho),
Unicons, `typed.js`, `scrollreveal`. The page degrades sensibly if any fail —
`main.js` feature-checks both libraries before using them.

---

## Known issues

- **The Fake News live demo is down.** That repo's GitHub *homepage* field points at
  `fake-news-detection-system-zeta.vercel.app`, which currently returns **404**, so
  no "Live demo" link is shown on its card. Either redeploy it or clear the homepage
  field on the repo.
- **Not every repo is on the site.** `SRM-Bootcamp` and `shimi` are left off
  deliberately — the first has no README and no code of its own, the second is a
  single `.zip`. Add them only if that changes.

---

## Browser support

Modern evergreen browsers. Uses `aspect-ratio`, `backdrop-filter`, `inset`,
`clamp()`, CSS custom properties in `calc()`, `transform-box`, and `svh` units —
all with sensible fallbacks (`100vh` before `100svh`, `-webkit-backdrop-filter`
alongside the standard property, `contain: strict` behind an `@supports` guard).
