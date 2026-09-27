# Architecture: Sudipta Biswas portfolio

<!-- production-architecture stack=static scaffolded=2026-09-27 -->

Static site, no build step, served from the repo root by GitHub Pages. This file says where every
kind of code goes. Anyone adding code here (a person, a new session, another agent or skill) reads it
first and builds inside this layout. To change the layout, edit this file first, then move the files.

## Layout

```
index.html              the page. Markup only, plus one 7-line <head> script that must run before
                        first paint (sets .js, the saved theme and .m-on, so nothing flashes)
css/
  tokens.css            design tokens on :root: colour (R=G=B only), type, spacing, radius, motion, z-index
  base.css              reset and element defaults. No component classes
  layout.css            the page container (.wrap) and section headings (.sh)
  components/           one file per part of the page:
    a11y.css            screen-reader text, skip link
    controls.css        buttons, text links, chips
    header.css          fixed header, desktop nav, phone menu sheet
    hero.css  strip.css  about.css  services.css  work.css  skills.css
    experience.css  contact.css  footer.css  lightbox.css  toast.css  slideshow.css
  motion.css            entrances, scroll reveals, underline redraw, magnetic buttons, theme wipe,
                        reduced motion. Loaded last on purpose
js/
  main.js               entry: imports each module and calls its init, in order. No behaviour of its own
  config.js             the email address, breakpoints, asset paths. The only place for those values
  lib/
    dom.js              page handles and checks used by 2+ modules (reduce(), cssVar(), finePtr)
    three-kit.js        shared by the two 3D modules: lazy three.js import, WebGL check, drag input
  modules/              one feature per file, each exporting one init function:
    theme  nav-state  menu  copy-email  toast  confetti  work  live-tags  lightbox  reveal
    service-links  slideshow  underline  magnetic  footer-light  stat-3d  globe
assets/
  images/               portraits, project shots; thumbs/ for tiles, work/ for the full-size viewer
  fonts/                literata-3d.typeface.json (the "3" and "D" glyphs for the 3D stat)
  Sudipta_Biswas_CV.pdf kept at this path on purpose: the URL may already be in applications
demos/                  six standalone project builds, copied unchanged from ~/Documents/All_Site/.
                        Each is its own app with its own inline code; the rules below do not apply
work.html               older standalone work page, not linked from index.html
```

three.js itself is not in the repo: the `<head>` importmap points `three` at jsDelivr, and it is only
fetched when a 3D piece scrolls near the screen.

## Where things go

| To change | Open |
|---|---|
| a colour, font size, spacing or duration | css/tokens.css |
| how one part of the page looks | css/components/<part>.css |
| the page width or section headings | css/layout.css |
| an entrance, reveal or hover motion | css/motion.css (and its js/modules/reveal.js) |
| what one interactive feature does | js/modules/<feature>.js |
| the email address, a breakpoint, an asset path | js/config.js |
| an image | assets/images/ |
| a project's live demo | demos/<slug>/ plus the tile's data-demo in index.html |

## Add a feature (example: a testimonials strip)

1. The markup goes in index.html, in its section.
2. css/components/testimonials.css, linked in `<head>` before css/motion.css.
3. js/modules/testimonials.js exporting `initTestimonials()`, with a `modulepreload` link in `<head>`.
4. One import and one call in js/main.js.

## Rules

- Markup, style and behaviour stay in separate files.
- Stylesheet order matters: tokens, base, layout, components, motion. Keep new component files before
  motion.css.
- Components use `var(--token)`, never a raw colour. Every colour is R=G=B.
- A helper moves to js/lib/ only when a second module needs it.
- Soft caps: 200 lines per JS file, 300 per CSS file. Past that, split by component or feature.
- Motion plays once and stops: 0 running animations and 0 animation frames at rest.

## Check

```
python3 ~/.claude/skills/production-architecture/scaffold/scaffold.py check .
```

Exit code 0 means no FAIL findings. Serve locally with `python3 -m http.server 8911` (ES modules do
not run from file://).
