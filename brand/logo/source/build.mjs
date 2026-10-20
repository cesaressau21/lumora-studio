// Builds the Lumora Studio logo kit: SVG sources, PNG exports, app icon and ICO.
// Run from this folder: npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as opentypeNs from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const opentype = opentypeNs.parse ? opentypeNs : opentypeNs.default;
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..');

export const COLORS = {
  ink: '#111113',
  paper: '#ECEBF0',
  white: '#FFFFFF',
  accent: '#7C6CFF',
};

// Symbol on a 56-unit grid: three 26-unit modules (3-unit corner radius, 4-unit gutter)
// forming an L, and an 11-unit sphere of light in the inner corner. The modules are cut
// by a 15-unit halo around the sphere, so the gap to the light is a constant 4 units.
const S = 56;
const MODULES = [
  'M3 0H23A3 3 0 0 1 26 3V8.8197A15 15 0 0 0 22.2523 26H3A3 3 0 0 1 0 23V3A3 3 0 0 1 3 0Z',
  'M3 30H23A3 3 0 0 1 26 33V53A3 3 0 0 1 23 56H3A3 3 0 0 1 0 53V33A3 3 0 0 1 3 30Z',
  'M47.1803 30H53A3 3 0 0 1 56 33V53A3 3 0 0 1 53 56H33A3 3 0 0 1 30 53V33.7477A15 15 0 0 0 47.1803 30Z',
].join('');
const LIGHT = { cx: 36, cy: 20, r: 11 };

const r2 = (n) => Math.round(n * 1000) / 1000;

function symbolGroup(x, y, size, fg, light) {
  const k = size / S;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(k)})">`
    + `<path fill="${fg}" d="${MODULES}"/>`
    + `<circle fill="${light}" cx="${LIGHT.cx}" cy="${LIGHT.cy}" r="${LIGHT.r}"/></g>`;
}

function loadFont(file) {
  const buf = fs.readFileSync(path.join(here, 'fonts', file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const bold = loadFont('Manrope-ExtraBold.ttf');
const medium = loadFont('Manrope-SemiBold.ttf');

// Lays out a line with letter tracking (in em) so that its cap height equals `cap`.
function layoutLine(font, text, cap, trackingEm, baseline) {
  const size = (cap * font.unitsPerEm) / font.tables.os2.sCapHeight;
  const unit = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  let x = 0;
  const placed = glyphs.map((g, i) => {
    if (i > 0) x += font.getKerningValue(glyphs[i - 1], g) * unit + trackingEm * size;
    const at = x;
    x += g.advanceWidth * unit;
    return { g, at };
  });
  const box = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const p of placed) {
    const b = p.g.getPath(p.at, baseline, size).getBoundingBox();
    box.x1 = Math.min(box.x1, b.x1); box.y1 = Math.min(box.y1, b.y1);
    box.x2 = Math.max(box.x2, b.x2); box.y2 = Math.max(box.y2, b.y2);
  }
  return { font, size, placed, baseline, box };
}

function linePath(line, dx) {
  return line.placed.map((p) => p.g.getPath(p.at + dx, line.baseline, line.size).toPathData(3)).join('');
}

// Wordmark: LUMORA (Manrope ExtraBold, +0.2 em) over STUDIO (Manrope SemiBold, half the cap
// height), with STUDIO tracked so both lines share the same ink width.
function buildWordmark(cap) {
  const capSmall = cap * 0.5;
  const gap = cap * 0.45;
  const top = layoutLine(bold, 'LUMORA', cap, 0.2, cap);
  const probe = layoutLine(medium, 'STUDIO', capSmall, 0, cap + gap + capSmall);
  const width = top.box.x2 - top.box.x1;
  const extra = (width - (probe.box.x2 - probe.box.x1)) / (5 * probe.size);
  const bottom = layoutLine(medium, 'STUDIO', capSmall, extra, cap + gap + capSmall);
  const d = linePath(top, -top.box.x1) + linePath(bottom, -bottom.box.x1);
  return { d, width, height: cap + gap + capSmall, inkTop: top.box.y1, inkBottom: Math.max(top.box.y2, bottom.box.y2) };
}

const CAP = 20.7; // cap height of LUMORA in symbol units; text block = 0.72 of the symbol height
const word = buildWordmark(CAP);

function svgDoc(minX, minY, w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(minX)} ${r2(minY)} ${r2(w)} ${r2(h)}" role="img" aria-label="Lumora Studio">`
    + `<title>Lumora Studio</title>${body}</svg>\n`;
}

function wordGroup(x, y, fill) {
  return `<path fill="${fill}" transform="translate(${r2(x)} ${r2(y)})" d="${word.d}"/>`;
}

const LAYOUTS = {
  horizontal(c) {
    const gap = S * 0.34;
    const ty = (S - word.height) / 2;
    const minY = Math.min(0, ty + word.inkTop);
    const maxY = Math.max(S, ty + word.inkBottom);
    return svgDoc(0, minY, S + gap + word.width, maxY - minY,
      symbolGroup(0, 0, S, c.fg, c.light) + wordGroup(S + gap, ty, c.text));
  },
  stacked(c) {
    const gap = S * 0.36;
    const w = Math.max(S, word.width);
    const ty = S + gap;
    return svgDoc(0, 0, w, ty + word.inkBottom,
      symbolGroup((w - S) / 2, 0, S, c.fg, c.light) + wordGroup((w - word.width) / 2, ty, c.text));
  },
  symbol(c) {
    return svgDoc(0, 0, S, S, symbolGroup(0, 0, S, c.fg, c.light));
  },
  wordmark(c) {
    return svgDoc(0, word.inkTop, word.width, word.inkBottom - word.inkTop, wordGroup(0, 0, c.text));
  },
};

const VARIANTS = {
  'color-on-light': { fg: COLORS.ink, light: COLORS.accent, text: COLORS.ink },
  'color-on-dark': { fg: COLORS.paper, light: COLORS.accent, text: COLORS.paper },
  black: { fg: COLORS.ink, light: COLORS.ink, text: COLORS.ink },
  white: { fg: COLORS.white, light: COLORS.white, text: COLORS.white },
};

const PNG_WIDTHS = {
  horizontal: [600, 1200, 2400],
  stacked: [400, 800, 1600],
  symbol: [64, 128, 256, 512, 1024],
  wordmark: [600, 1200, 2400],
};

function write(rel, data) {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  return file;
}

function renderPng(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

const written = [];
for (const [layout, make] of Object.entries(LAYOUTS)) {
  for (const [variant, colors] of Object.entries(VARIANTS)) {
    const name = `lumora-${layout}-${variant}`;
    const svg = make(colors);
    written.push(write(`svg/${name}.svg`, svg));
    for (const w of PNG_WIDTHS[layout]) written.push(write(`png/${layout}/${name}-${w}.png`, renderPng(svg, w)));
  }
}

// App icon: light symbol on a dark rounded tile, matching the Relight Studio UI background.
function appIcon() {
  const size = 512;
  const inner = size * 0.64;
  const o = (size - inner) / 2;
  return svgDoc(0, 0, size, size,
    `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${COLORS.ink}"/>`
    + symbolGroup(o, o, inner, COLORS.paper, COLORS.accent));
}

const icon = appIcon();
written.push(write('icon/lumora-app-icon.svg', icon));
written.push(write('icon/favicon.svg', icon));
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];
const iconPngs = {};
for (const s of ICON_SIZES) {
  iconPngs[s] = renderPng(icon, s);
  written.push(write(`icon/lumora-app-icon-${s}.png`, iconPngs[s]));
}
const ico = await pngToIco([16, 24, 32, 48, 64, 128, 256].map((s) => iconPngs[s]));
written.push(write('icon/lumora.ico', ico));

console.log(`Wrote ${written.length} files to ${outDir}`);
console.log(`Wordmark: ${r2(word.width)} x ${r2(word.height)} units (symbol ${S})`);
