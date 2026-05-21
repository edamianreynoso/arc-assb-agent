#!/usr/bin/env node
/**
 * Convert the 4 paper-figure SVGs into cropped PDFs using headless Chromium.
 *
 * Why Chromium: it renders SVG pixel-perfect (same engine as the preview we
 * validated visually) and can print to PDF via the DevTools protocol without
 * any native SVG-to-PDF library or Inkscape.
 *
 * Output PDFs go into the same folder as the SVGs. Naming: fig1_*.svg → fig1_*.pdf.
 *
 * Usage:
 *   npx tsx experiments/arc-assb-agent/analysis/svg-to-pdf.ts \
 *       --src experiments/arc-assb-agent/runs/default/<runId>/figures
 */

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

function parseArgs(argv: string[]): { src: string } {
    const i = argv.indexOf('--src');
    if (i < 0 || !argv[i + 1]) {
        console.error('Usage: svg-to-pdf.ts --src <path-to-folder-with-svgs>');
        process.exit(1);
    }
    return { src: path.resolve(process.cwd(), argv[i + 1]) };
}

/** Locate a Chromium/Chrome/Edge binary to drive headless rendering. */
function findBrowser(): string {
    const candidates = [
        process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ].filter(Boolean) as string[];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    throw new Error('Could not locate a Chromium-family browser. Set CHROME_PATH env var.');
}

async function svgToPdf(svgPath: string, pdfPath: string) {
    const svg = fs.readFileSync(svgPath, 'utf-8');
    // Extract viewBox width / height for precise PDF page sizing.
    const vbMatch = svg.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/);
    const w = vbMatch ? parseFloat(vbMatch[1]) : 800;
    const h = vbMatch ? parseFloat(vbMatch[2]) : 400;

    // Wrap into minimal HTML so Chromium paginates the SVG into a single page
    // of exact dimensions (no letter-page framing, no margins).
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html, body { margin: 0; padding: 0; }
svg { display: block; width: ${w}px; height: ${h}px; }
@page { size: ${w}px ${h}px; margin: 0; }
</style></head><body>${svg}</body></html>`;

    const browser = await puppeteer.launch({
        executablePath: findBrowser(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: pdfPath,
            width: `${w}px`,
            height: `${h}px`,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true,
        });
    } finally {
        await browser.close();
    }
}

async function main() {
    const { src } = parseArgs(process.argv.slice(2));
    const svgs = fs.readdirSync(src).filter((f) => f.endsWith('.svg'));
    if (svgs.length === 0) {
        console.error(`No SVGs in ${src}`);
        process.exit(1);
    }
    console.log(`Converting ${svgs.length} SVGs → PDF …`);
    for (const name of svgs) {
        const svgPath = path.join(src, name);
        const pdfPath = path.join(src, name.replace(/\.svg$/, '.pdf'));
        await svgToPdf(svgPath, pdfPath);
        const size = fs.statSync(pdfPath).size;
        console.log(`  ✓ ${name.replace(/\.svg$/, '.pdf')} (${size} bytes)`);
    }
    console.log('Done.');
}

main().catch((err) => {
    console.error('FATAL:', err instanceof Error ? err.stack : String(err));
    process.exit(2);
});
