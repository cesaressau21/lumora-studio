# Lumora Studio website

A static one-page site with no build step: `index.html`, `styles.css`, `main.js` and `assets/`.

- **Hero:** a light demo in a `<canvas>` (`main.js`). The Lumora symbol becomes a height map. Its normals give per-pixel diffuse shading, and a short march toward the light gives screen-space shadows, the same idea Relight Studio AI uses on photos. Drag the light with a mouse or touch, move it with the arrow keys (`Shift` for bigger steps), or reset it with `Home`, `Escape` or the Reset light button. With reduced motion turned on, the entrance animation is skipped.
- **Sections:** the studio intro, Relight Studio AI (with download links to its GitHub releases), and room for future apps.
- **Fonts:** Manrope, loaded from Google Fonts (SIL Open Font License 1.1).
- **Assets:** copied from `../brand/logo` and from the Relight Studio AI icon. Copy them again if the logo kit changes.

## Preview locally

Any static file server works. For example:

```bash
npx http-server . -p 5174
```

## Deploy

Upload the folder as is to any static host, such as GitHub Pages, Netlify or Cloudflare Pages.
