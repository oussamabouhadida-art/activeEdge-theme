# ActiveEdge Theme

A production-ready Shopify theme for **ActiveEdge** — a lifestyle sports accessories brand.  
"Bouge libre." — Warm, modern, inspiring, accessible-premium.

---

## Theme Vision

ActiveEdge is designed for the European active lifestyle market (primary: France). The theme blends the commercial fluidity of best-in-class DTC brands with a warm, modern aesthetic rooted in the ActiveEdge green palette. Every design decision prioritizes conversion, mobile experience, and brand trust.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Template engine | Shopify Liquid 2.0 (Online Store 2.0) |
| CSS | Vanilla CSS with custom properties, mobile-first, BEM naming |
| JavaScript | Vanilla ES6+, Web Components, no dependencies |
| Fonts | Montserrat (headings) + Inter (body) via Google Fonts |
| Cart | Ajax drawer via Fetch API |
| Localization | Shopify Translation API (`{{ 'key' | t }}`) |
| CI/CD | GitHub → Shopify theme push (optional Actions) |

---

## File Structure

```
activeEdge-theme/
├── config/
│   ├── settings_schema.json   # Theme customizer schema
│   └── settings_data.json     # Default theme settings
├── layout/
│   └── theme.liquid           # Master layout: <head>, header, footer, cart drawer
├── templates/                 # Route-level templates (JSON or Liquid)
│   ├── index.liquid           # Homepage
│   ├── collection.json        # Collection page
│   ├── product.json           # Product page
│   ├── cart.liquid            # Cart fallback page
│   ├── page.json              # Generic CMS page
│   ├── blog.liquid            # Blog listing
│   ├── article.liquid         # Blog post
│   ├── search.liquid          # Search results
│   ├── 404.liquid             # Not found
│   └── customers/             # Account pages
├── sections/                  # Section files (customizable blocks)
│   ├── header.liquid
│   ├── footer.liquid
│   ├── announcement-bar.liquid
│   ├── hero.liquid
│   ├── featured-categories.liquid
│   ├── featured-collection.liquid
│   ├── why-activeedge.liquid
│   ├── lifestyle-split.liquid
│   ├── social-proof.liquid
│   ├── trust-bar.liquid
│   ├── newsletter.liquid
│   ├── product-recommendations.liquid
│   ├── main-collection.liquid
│   ├── main-product.liquid
│   ├── main-cart.liquid
│   ├── main-search.liquid
│   ├── main-page.liquid
│   ├── main-blog.liquid
│   ├── main-article.liquid
│   └── main-404.liquid
├── snippets/                  # Reusable Liquid partials
│   ├── product-card.liquid
│   ├── cart-drawer.liquid
│   ├── cart-item.liquid
│   ├── price.liquid
│   ├── icon-*.liquid          # SVG icon set
│   ├── pagination.liquid
│   ├── breadcrumb.liquid
│   └── language-switcher.liquid
├── assets/                    # CSS + JS files
│   ├── base.css               # Design tokens, reset, typography
│   ├── component-*.css        # Component-scoped styles
│   ├── section-homepage.css   # Homepage section styles
│   ├── global.js              # Core JS: cart drawer, header, utils
│   ├── cart-drawer.js         # Cart drawer fetch logic
│   ├── product-form.js        # PDP form + sticky ATC
│   └── search.js              # Predictive search
└── locales/
    ├── fr.default.json        # French (primary)
    ├── en.default.json        # English
    └── es.json                # Spanish (placeholder)
```

---

## Installation

### Prerequisites
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) ≥ 3.x
- Node.js ≥ 18

### Connect to your store

```bash
shopify auth login --store your-store.myshopify.com
```

### Push to development theme

```bash
cd activeEdge-theme
shopify theme push --development
```

### Live development (hot reload)

```bash
shopify theme dev --store your-store.myshopify.com
```

### Push to production

```bash
shopify theme push --theme <theme-id>
```

---

## Development Workflow

1. **Clone** this repo
2. Run `shopify theme dev` for live editing with hot reload
3. Edit sections/snippets/assets — changes sync instantly
4. Commit to `main` branch
5. GitHub Action (optional) auto-pushes to Shopify on merge

### Recommended editor setup
- VS Code + [Shopify Liquid](https://marketplace.visualstudio.com/items?itemName=Shopify.theme-check-vscode) extension
- Theme Check for Liquid linting

---

## Translation System

All user-facing strings use Shopify's translation filter:

```liquid
{{ 'general.cart.title' | t }}
{{ 'products.product.add_to_cart' | t }}
```

Translation files live in `locales/`:
- `fr.default.json` — French (primary language, served by default)
- `en.default.json` — English
- `es.json` — Spanish

To add a new language:
1. Create `locales/[lang-code].json`
2. Copy the structure from `en.default.json`
3. Translate all values
4. Add the language in Shopify Admin → Settings → Languages

---

## Customization Guide

All sections are fully customizable via the Shopify Theme Customizer (Online Store → Themes → Customize).

### Color Scheme
Colors are defined as CSS custom properties in `assets/base.css`:

```css
:root {
  --color-brand: #2D6A4F;
  --color-brand-light: #52B788;
  --color-accent: #74C69D;
  --color-mint: #D8F3DC;
  --color-bg: #FFFFFF;
  --color-bg-soft: #F0FAF5;
  --color-text: #1A1A1A;
  --color-text-muted: #4A4A4A;
}
```

### Typography
Fonts are loaded via `layout/theme.liquid`. To change fonts, update the `<link>` tag in the `<head>` and the CSS variables:

```css
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Inter', sans-serif;
```

### Adding Sections
1. Create `sections/my-section.liquid`
2. Add a `{% schema %}` block at the bottom
3. Include presets so it appears in the customizer

---

## GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` to auto-deploy on push:

```yaml
name: Deploy to Shopify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: shopify/shopify-cli-action@v1
        with:
          store: ${{ secrets.SHOPIFY_STORE }}
          theme-id: ${{ secrets.SHOPIFY_THEME_ID }}
          shopify-flag-access-token: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
```

---

## Brand Guidelines

- **Primary color:** `#2D6A4F` (ActiveEdge Green)
- **Tagline:** "Bouge libre."
- **Voice:** Warm, encouraging, lifestyle-first, modern French
- **Target:** Active Europeans, 25–45, urban runners, wellness enthusiasts

---

## License

Proprietary — ActiveEdge / eTrading Company. All rights reserved.
