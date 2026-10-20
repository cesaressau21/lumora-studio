# Lumora Studio — logo kit

Lumora Studio is the parent brand of a suite of creative desktop apps (the first is Relight Studio AI).
Open `preview.html` to see every variant on light and dark backgrounds.

## The mark

- **Symbol:** three modules form an L (the L of Lumora, and the suite of tools). A sphere of light sits in the inner corner of the L, and the modules are cut by a halo around it, keeping a constant gap to the light.
- **Wordmark:** `LUMORA` over `STUDIO`. Both lines share the same width.
- Flat geometry with no gradients. It works in one color and down to 16 px.

## Files

| Folder | Contents |
| --- | --- |
| `svg/` | Vector masters: `lumora-{layout}-{variant}.svg` |
| `png/{layout}/` | Transparent PNG exports: `lumora-{layout}-{variant}-{width}.png` |
| `icon/` | App icon and favicon: `lumora-app-icon.svg`, `favicon.svg`, `lumora-app-icon-{16,24,32,48,64,128,256,512}.png`, `lumora.ico` (16–256) |
| `source/` | `build.mjs`, which regenerates the whole kit, plus the Manrope fonts and their license |
| `preview.html` | Visual overview of the kit |

**Layouts:** `horizontal` (primary), `stacked`, `symbol`, `wordmark`.

**Variants:**

| Variant | Use on | Modules / text | Light |
| --- | --- | --- | --- |
| `color-on-light` | White or light backgrounds | Ink `#111113` | Indigo `#7C6CFF` |
| `color-on-dark` | Dark backgrounds | Paper `#ECEBF0` | Indigo `#7C6CFF` |
| `black` | One-color printing, light backgrounds | Ink `#111113` | Ink `#111113` |
| `white` | One-color use on dark or colored backgrounds | White `#FFFFFF` | White `#FFFFFF` |

**PNG widths:** horizontal and wordmark at 600, 1200 and 2400 px. Stacked at 400, 800 and 1600 px. Symbol at 64, 128, 256, 512 and 1024 px.

## Colors

| Name | Hex | Role |
| --- | --- | --- |
| Ink | `#111113` | Primary dark, the app icon tile, logo on light backgrounds |
| Paper | `#ECEBF0` | Logo on dark backgrounds |
| Lumora Indigo | `#7C6CFF` | Brand accent: the sphere of light |
| White | `#FFFFFF` | One-color reversed logo |

Ink and Paper match the Relight Studio AI interface. The orange `#FF9A3C` stays Relight's own accent, and each app keeps its own color under the neutral Lumora base.

## Typography

- **Font:** [Manrope](https://github.com/googlefonts/manrope) by Mikhail Sharanda. `LUMORA` is set in ExtraBold (800) with +0.2 em tracking. `STUDIO` is set in SemiBold (600) at half the cap height, tracked to the width of `LUMORA`.
- **License:** SIL Open Font License 1.1, free for commercial use (see `source/fonts/Manrope-OFL.txt`).
- In every SVG and PNG the text is already converted to outlines, so you don't need the font installed to use the logo.

## Usage

- **Clear space:** keep at least the width of one module (about half the symbol's height) free around the logo.
- **Minimum size:** symbol at 16 px. Horizontal lockup at 160 px wide, or 35 mm in print. Below that, use the symbol alone.
- Don't recolor the modules with the accent, add gradients or shadows, rotate, stretch, or change the spacing between the symbol and the wordmark.

## Rebuilding

The geometry and the text layout live in `source/build.mjs`. To regenerate everything:

```bash
cd source
npm install
npm run build
```
