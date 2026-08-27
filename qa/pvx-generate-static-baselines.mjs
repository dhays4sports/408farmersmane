import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/pvx-ux-1.0/viewports.json'), 'utf8'));
const output = path.join(root, 'fixtures/pvx-ux-1.0/screenshots');
fs.mkdirSync(output, { recursive: true });

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));

function svg(viewport) {
  const width = viewport.width;
  const height = viewport.height;
  const mobile = width < 600;
  const margin = mobile ? 12 : Math.max(24, Math.round((width - 680) / 2));
  const cardWidth = Math.min(680, width - margin * 2);
  const cardX = Math.round((width - cardWidth) / 2);
  const cardY = mobile ? 132 : 158;
  const cardHeight = Math.min(height - cardY - 34, mobile ? 620 : 650);
  const pad = mobile ? 20 : 42;
  const choices = ['My price changed','I’m buying a home','My renewal is coming up','I’m simply comparing','Something else'];
  const choiceH = mobile ? 58 : 60;
  const startY = cardY + (mobile ? 178 : 184);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#fbfdfc"/><stop offset="1" stop-color="#f2f8f5"/></linearGradient><linearGradient id="brand" x2="1"><stop stop-color="#1478c9"/><stop offset="1" stop-color="#26ae60"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#082846" flood-opacity=".12"/></filter></defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${mobile ? 66 : 76}" fill="#fff" stroke="#dce7ed"/>
    <circle cx="${margin + 16}" cy="${mobile ? 33 : 38}" r="15" fill="#26ae60"/><path d="M${margin+9} ${mobile?33:38}l5 5 10-12" fill="none" stroke="#fff" stroke-width="3"/>
    <text x="${margin + 40}" y="${mobile ? 39 : 44}" font-family="Arial,sans-serif" font-size="${mobile ? 20 : 23}" font-weight="700" fill="#082846">CoverageFit</text>
    <text x="${width - margin}" y="${mobile ? 39 : 44}" text-anchor="end" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#153d5d">Save &amp; exit</text>
    <text x="${margin}" y="${mobile ? 93 : 105}" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#158a48">YOUR GOALS</text>
    <text x="${width-margin}" y="${mobile ? 93 : 105}" text-anchor="end" font-family="Arial,sans-serif" font-size="12" fill="#607487">Step 1 of 5</text>
    <rect x="${margin}" y="${mobile ? 108 : 119}" width="${width-margin*2}" height="6" rx="3" fill="#e6eef2"/><rect x="${margin}" y="${mobile ? 108 : 119}" width="${Math.round((width-margin*2)*.2)}" height="6" rx="3" fill="url(#brand)"/>
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${Math.max(300,cardHeight)}" rx="${mobile?22:28}" fill="#fff" stroke="#dce7ed" filter="url(#shadow)"/>
    <text x="${cardX+pad}" y="${cardY+42}" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="1.3" fill="#158a48">A QUICK START</text>
    <text x="${cardX+pad}" y="${cardY+82}" font-family="Arial,sans-serif" font-size="${mobile?28:36}" font-weight="700" fill="#082846">What’s bringing you</text>
    <text x="${cardX+pad}" y="${cardY+118}" font-family="Arial,sans-serif" font-size="${mobile?28:36}" font-weight="700" fill="#082846">here today?</text>
    <text x="${cardX+pad}" y="${cardY+146}" font-family="Arial,sans-serif" font-size="14" fill="#607487">Choose the closest answer. You can always go back.</text>
    ${choices.map((choice,index)=>{const y=startY+index*(choiceH+10);if(y+choiceH>cardY+cardHeight-44)return '';return `<rect x="${cardX+pad}" y="${y}" width="${cardWidth-pad*2}" height="${choiceH}" rx="14" fill="#fff" stroke="#dce7ed"/><text x="${cardX+pad+16}" y="${y+choiceH/2+5}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#082846">${escape(choice)}</text><circle cx="${cardX+cardWidth-pad-17}" cy="${y+choiceH/2}" r="10" fill="none" stroke="#b9c9d3" stroke-width="2"/>`;}).join('')}
  </svg>`;
}

for (const viewport of fixtures.viewports) {
  const source = path.join(output, `${viewport.id}.svg`);
  const target = path.join(output, `${viewport.id}.png`);
  fs.writeFileSync(source, svg(viewport));
  await sharp(Buffer.from(svg(viewport))).png().toFile(target);
}

fs.writeFileSync(path.join(output, 'README.md'), '# CF-PVX-UX-1.0 baseline renders\n\nThese deterministic viewport baselines are generated from the approved foundation visual contract. The capture script `qa/pvx-capture-baselines.mjs` can replace them with live browser screenshots when a Playwright browser binary is available.\n');
console.log(JSON.stringify({ generated: fixtures.viewports.length, output }, null, 2));
