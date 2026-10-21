# Lumora Studio website

A static one-page site with no build step: `index.html`, `styles.css`, `hero3d.js` and `assets/`.

- **Hero:** the Lumora symbol in 3D with Three.js (`hero3d.js`, loaded from jsDelivr through an import map, version pinned to 0.185.1). The three modules are extruded from the exact logo outlines. The indigo sphere is a point light that shades the modules, with an additive glow behind it. On load the modules assemble once, and after that the symbol tilts toward the pointer. Rendering pauses when the hero is off screen or the tab is hidden.
- **Fallbacks:** without WebGL 2, the static SVG symbol is shown instead. With reduced motion turned on, a single still frame is rendered.
- **Sections:** the studio and its principles, the apps (Relight Studio AI first, with download links to its GitHub releases), and a closing call to follow the studio on GitHub.
- **Fonts:** Manrope, loaded from Google Fonts (SIL Open Font License 1.1).
- **Assets:** copied from `../brand/logo` and from the Relight Studio AI brand kit (`assets/brand/icon` in its repo: `relight-app-icon.svg`, and `relight-app-icon-small.svg` for small sizes). Copy them again if either kit changes.

## Preview locally

The page uses ES modules, so it needs a static file server rather than opening the file directly:

```bash
npx http-server . -p 5174
```

## Deploy

`.github/workflows/pages.yml` publishes this folder to GitHub Pages on every push to `main` that changes it.
