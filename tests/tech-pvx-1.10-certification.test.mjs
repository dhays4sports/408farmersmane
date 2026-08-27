import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapWebToPvx, validateWebPvxMapping } from '../server/web-pvx-mapping-core.mjs';
import { createOrReusePvxWebJourney, resolvePvxWebDestination } from '../server/pvx-web-journey-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('pvx/start/index.html');
const renter = read('assets/js/tech-pvx-renter-continuity-1.10.js');
const contract = read('assets/js/tech-pvx-contract-1.10.js');
const bootstrap = read('assets/js/pvx-web-bootstrap.js');
const css = read('assets/css/tech-pvx-renter-continuity-1.10.css');

class Store {
  constructor(){ this.rows = new Map(); }
  async get(key){ return this.rows.get(key) || null; }
  async setJSON(key, value, options={}){ if(options.onlyIfNew && this.rows.has(key)) throw new Error('exists'); this.rows.set(key, structuredClone(value)); return true; }
}

const base = {
  entry_type:'professional', customer_selection:'secure_continue', source:'408farmers_tech', route_path:'/tech/',
  professional_program:'technology', professional_role:'it_cybersecurity', professional_role_label:'IT / Cybersecurity',
  housing_context:'owner', occupancy:'owner', review_track:'home_snapshot',
  tech_lead_checkpoint_id:'techlc_QWERTYUIOPASDFGHJKLZXCVB', bootstrap_id:'pvxb_QWERTYUIOPASDFGH',
  early_capture_status:'skipped', early_lead_confirmed:'false'
};

test('TECH-PVX-1.10 certification: missing attribution is safe and homeowner can remain anonymous', async () => {
  const mapping = mapWebToPvx(base);
  assert.deepEqual(validateWebPvxMapping(mapping), { valid:true, errors:[] });
  assert.equal(mapping.identity.supplied, false);
  assert.equal(mapping.attribution.campaignId, '');
  assert.equal(mapping.attribution.utm.source, '');
  const created = await createOrReusePvxWebJourney(base, { store:new Store(), sourceOrigin:'https://408farmers.com', now:new Date('2026-08-27T18:00:00Z') });
  assert.equal(resolvePvxWebDestination(created.record), '/pvx/start/');
  assert.equal(created.record.seed.identity.firstName, '');
});

test('TECH-PVX-1.10 certification: captured homeowner identity is secure reusable seed only', async () => {
  const input = {...base, early_capture_status:'confirmed', early_lead_confirmed:'true', first_name:'Ada', mobile:'+14085551212', agency_contact_consent:'true', agency_contact_consent_version:'tech-pvx-early-agency-contact-v1', agency_contact_consent_timestamp:'2026-08-27T18:00:00.000Z', sms_consent:'false', call_consent:'false', email_consent:'false'};
  const created = await createOrReusePvxWebJourney(input, { store:new Store(), sourceOrigin:'https://408farmers.com', now:new Date('2026-08-27T18:00:00Z') });
  assert.equal(created.record.seed.identity.firstName, 'Ada');
  assert.equal(created.record.seed.identity.mobile, '+14085551212');
  assert.equal(created.record.seed.consent.contact, false);
  assert.equal(created.record.seed.consent.sms, false);
  assert.equal(resolvePvxWebDestination(created.record), '/pvx/start/');
  assert.match(bootstrap, /firstName: earlyConfirmed \? clean\(identity\.firstName/);
  assert.match(bootstrap, /phone: earlyConfirmed \? clean\(identity\.mobile/);
});

test('TECH-PVX-1.10 certification: renter value is available before contact and identity is not repeated', () => {
  assert.match(renter, /snapshot_completed/);
  assert.match(renter, /Have Dylan review this/);
  assert.match(renter, /readonly/);
  assert.match(renter, /identity\.supplied/);
  assert.match(renter, /action:'contact_only'/);
  assert.match(renter, /contactRequested:true/);
  assert.match(renter, /consent:\{reportSaved:false,\.\.\.channel\}/);
  assert.doesNotMatch(renter + contract, /console\.(?:log|info|debug|warn|error)/);
});

test('TECH-PVX-1.10 certification: privacy-safe analytics and bounded lifecycle', () => {
  assert.match(renter, /new Set\(\['snapshot_completed','contact_requested'\]\)/);
  const analytics = renter.slice(renter.indexOf('function analytics'), renter.indexOf('function sync'));
  for (const forbidden of ['firstName', 'mobile', 'phone', 'email', 'address', 'question']) assert.equal(analytics.includes(forbidden), false);
  assert.match(contract, /techLeadCheckpointId/);
  assert.doesNotMatch(contract, /eligible\s*:\s*true|qualified\s*:\s*true|approved\s*:\s*true/);
});

test('TECH-PVX-1.10 certification: mobile, accessibility, and performance source gates', () => {
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /@media\(max-width:340px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /min-height:(?:48|50)px/);
  assert.match(renter, /aria-live="polite"/);
  assert.match(renter, /aria-pressed/);
  assert.match(html, /<script defer src="\/assets\/js\/tech-pvx-contract-1\.10\.js/);
  assert.match(html, /<script defer src="\/assets\/js\/tech-pvx-renter-continuity-1\.10\.js/);
  assert.doesNotMatch(renter + contract, /\b(?:React|Vue|Angular|jQuery|axios)\b/);
});
