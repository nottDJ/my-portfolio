# Portfolio — Divij K P

A single-page personal portfolio with a hand-drawn Japanese (和) theme: a layered
ukiyo-e backdrop that parallaxes as you scroll, and a project card for each repo
with its own hand-authored SVG illustration.

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
| `index.html` | All markup, including the backdrop layers and the five project SVGs |
| `style.css` | Layout, typography, components, responsive breakpoints |
| `japanese-bg.css` | The backdrop's layers **and the colour tokens the whole site reads** |
| `japanese-bg.js` | Scroll parallax + the sakura petal canvas |
| `project-art.css` | Every project illustration's animation |
| `main.js` | Nav, typed hero text, scroll reveal, active-section highlighting |
| `resume.pdf` | Served by both "Download CV" buttons |
| `assets/images/` | `pfp.png` (portrait), `dj.png` (favicon) |
| `aether/` | A **separate** experimental React/Vite portfolio. Not part of this site. |

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

Two rules the SVG animation code follows, both documented in `project-art.css`:

1. An element must never carry **both** a `transform` attribute and an animated CSS
   `transform` — the CSS one wins outright and the authored placement is silently
   lost. Where both are needed, the markup nests an outer placement `<g>` around an
   inner animated `<g>`.
2. Scaling or rotating an SVG element needs an explicit `transform-box`, or
   `transform-origin` resolves differently across browsers.

The five loops run at **12 / 13 / 14 / 15 s** deliberately, so the cards never fall
into step and start pulsing as a group.

Every card also has a **hand-authored reduced-motion frame**. Simply stopping the
animations isn't enough — several elements are authored in their *pre*-animation
state (zero-length dashes, zero opacity), so the `prefers-reduced-motion` block
resolves each card to the single still frame that tells the most of its story.

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
something card-specific. All eleven SVGs share one document, so a duplicate id
silently breaks whichever element references it second.

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
- Scroll listeners are all `{ passive: true }`.
- Left/right scroll reveals are gated to ≥ 901 px. Below that the layout is a single
  stacked column, where ScrollReveal's pre-reveal `translateX` used to push content
  60 px past the viewport edge.

External dependencies, all from CDNs: Google Fonts (Poppins + Shippori Mincho),
Unicons, `typed.js`, `scrollreveal`. The page degrades sensibly if any fail —
`main.js` feature-checks both libraries before using them.

---

## Known issues

- **`pfp.png` is 2.1 MB.** It's the single heaviest asset on the page and the first
  thing worth optimising — resizing to ~800 px and converting to WebP would cut it
  by well over 90%.
- **The Fake News live demo is down.** That repo's GitHub *homepage* field points at
  `fake-news-detection-system-zeta.vercel.app`, which currently returns **404**, so
  no "Live demo" link is shown on its card. Either redeploy it or clear the homepage
  field on the repo.
- **The project list follows the GitHub profile README**, which currently features
  five projects. The résumé features two more —
  [Predictive Network Traffic Management](https://github.com/nottDJ/Predictive-Network-Traffic-Management)
  and [Smart City Civic Issue Tracker](https://github.com/nottDJ/Smart-City-Civic-Issue-Tracker)
  (live at `civicissuereporting.vercel.app`) — that are not on the site yet.
- **`server.js` is an empty file.** Safe to delete.

---

## Browser support

Modern evergreen browsers. Uses `aspect-ratio`, `backdrop-filter`, `inset`,
`clamp()`, CSS custom properties in `calc()`, `transform-box`, and `svh` units —
all with sensible fallbacks (`100vh` before `100svh`, `-webkit-backdrop-filter`
alongside the standard property, `contain: strict` behind an `@supports` guard).
