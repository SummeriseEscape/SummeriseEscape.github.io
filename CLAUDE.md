# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev        # Start dev server (Astro)
npm run build      # Production build to ./dist
npm run preview    # Preview production build
```

No test suite or linting is configured.

## Architecture

This is a static Astro 5 personal blog ("星风") deployed to GitHub Pages via the `.github/workflows/deploy.yml` workflow (builds on push to `main`, deploys `./dist` via `actions/deploy-pages`).

### Content model

Posts are MDX files in `src/content/posts/`. Each post has a Zod-validated frontmatter schema defined in `src/content/config.ts`:

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required |
| `date` | date | Required |
| `updated` | date | Optional |
| `excerpt` | string | Required |
| `category` | enum | `poetry` / `diary` / `essay` / `photography` / `music` |
| `mood` | enum | `tranquil` / `nostalgic` / `dreamy` / `warm` / `melancholic` |
| `image` | string | Path to post cover image |
| `imageAlt` | string | Required |
| `tags` | string[] | Optional |
| `draft` | boolean | Default `false`. Draft posts are filtered out in all queries via `({ data }) => !data.draft` |
| `featured` | boolean | Default `false` (not yet wired up to the UI) |

### Route map

| Path | File | Purpose |
|------|------|---------|
| `/` | `src/pages/index.astro` | Home: Hero + PostGrid |
| `/posts/` | `src/pages/posts/index.astro` | Post listing with `?category=` filter |
| `/posts/[slug]/` | `src/pages/posts/[...slug].astro` | Single post (dynamic paths via `getStaticPaths`) |
| `/about/` | `src/pages/about.astro` | About page |
| `/rss.xml` | `src/pages/rss.xml.ts` | RSS feed |
| `/sitemap.xml` | `src/pages/sitemap.xml.ts` | XML sitemap |

### Layout system

`BaseLayout.astro` is the root shell for every page. It renders the full HTML document including `<head>`, imports all CSS, and provides a sidebar + main content layout. It accepts optional `title`, `description`, and `image` props for SEO.

Pages use `<BaseLayout>` as a wrapper and slot their content into `<main class="main-content">`.

### Design system

**Theme**: Light/dark mode via `data-theme` attribute on `<html>`. A tiny inline `<script is:inline>` in `BaseLayout` reads from `localStorage` before paint to avoid FOUC. `ThemeToggle.astro` handles the toggle interaction. All design tokens are CSS custom properties on `:root` and `[data-theme='dark']` in `src/styles/global.css`. The color palette uses muted, atmospheric tones (night-blue, breeze-blue, summer-pink, dust-purple).

**CSS**: Tailwind CSS 4 via `@tailwindcss/vite` (Vite plugin, not PostCSS). The Tailwind import is in `global.css`. Inline `style` attributes on components use CSS variables extensively — prefer these over Tailwind utility classes when styling with design tokens.

**Typography**: `@font-face` loaded from `public/fonts/` — 全字库正楷体 (TW Kai, body), Inter + Space Grotesk (UI). `var(--font-serif)` and `var(--font-sans)` are the CSS font-family stacks.

**Sidebar**: Fixed left sidebar (200px) with vertical-rl text. On mobile (≤768px), sidebar collapses to a fixed top bar. `var(--sidebar-width)` drives the layout — set to 0 on mobile.

### Animations

Three animation modules are initialized in `BaseLayout.astro`:

1. **`smoothScroll.ts`** — Lenis smooth scrolling (runs immediately).
2. **`entrance.ts`** — GSAP + ScrollTrigger: hero blur-fade, geometric circle stagger, post card fade-in on scroll, post content paragraph stagger. Runs on `DOMContentLoaded`.
3. **`floating.ts`** — GSAP parallax on geometric circles following mouse movement. Runs on `DOMContentLoaded`.

Additionally, `Starfield.astro` uses `starfield.ts` (custom canvas class) for the hero background — it auto-pauses when not visible via IntersectionObserver.

### UI components

- **`GeometricCircle`** — Decorative floating circles with radial gradients and float keyframe animation. Positioned absolutely via props (`top`, `left`, `right`, `bottom`).
- **`MoodBadge`** — Colored pill badge for post mood (5 moods mapped to design token colors).
- **`MusicPlayer`** — Hidden panel with playlist, toggle/close on Escape. Uses placeholder audio — real tracks go in `public/audio/`.
- **`SEO`** — Open Graph + Twitter Card + standard meta tags. Site URL comes from `astro.config.mjs` (`site` config).
- **`DotGrid`** — SVG pattern background decoration.

### Site constants

`src/utils/constants.ts` exports `SITE` with `title`, `tagline`, `description`, `author`, `lang`, `locale`. Used by the RSS endpoint and available for any component. The `site` URL in `astro.config.mjs` is the canonical source for full-URL generation (OG images, RSS links, sitemap).

### Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json` paths and resolved by Astro/Vite).

## Adding a new post

Create an `.mdx` file in `src/content/posts/` with the required frontmatter fields. Images go in `public/images/posts/`. To hide a post, set `draft: true` — it will be excluded from all listings, RSS, and sitemap automatically.
