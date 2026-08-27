import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/pvx-ux-1.0/viewports.json'), 'utf8'));
const output = path.join(root, 'fixtures/pvx-ux-1.0/screenshots');
fs.mkdirSync(output, { recursive: true });
const baseUrl = process.env.PVX_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

for (const viewport of fixtures.viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/pvx/?preview=1`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(output, `${viewport.id}.png`), fullPage: true });
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ captured: fixtures.viewports.length, output }, null, 2));
