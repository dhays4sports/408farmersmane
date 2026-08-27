import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mapWebToPvx,
  validateWebPvxMapping,
  TECH_PVX_ROLES,
  COVERAGEFIT_IDENTITY_SYNC_BUILD,
  UPSTREAM_IDENTITY_CONTRACT
} from '../server/web-pvx-mapping-core.mjs';
import { SMS_LINK_ENTRY_MESSAGES, SMS_AUTOMATION_INTRO } from '../server/sms-conversation-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const runtimeHtml = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['cf-disp', 'qa', 'tests', 'releases', 'certifications', 'contracts'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith('.html')) runtimeHtml.push(absolute);
  }
};
walk(root);

const confirmedTech = {
  entry_type:'professional', customer_selection:'secure_continue', source:'408farmers_tech', route_path:'/tech/', host_mode:'408farmers',
  professional_program:'technology', professional_role:'software_engineering', professional_role_label:'Software / Engineering',
  housing_context:'owner', occupancy:'owner', review_track:'home_snapshot', tech_lead_checkpoint_id:'techlc_ABCDEFGHIJKLMNOPQRSTUV',
  bootstrap_id:'pvxb_ABCDEFGHIJKLMNOP', early_capture_status:'confirmed', early_lead_confirmed:'true', first_name:'Ada', mobile:'+14085551212',
  agency_contact_consent:'true', agency_contact_consent_version:'tech-pvx-early-agency-contact-v1', agency_contact_consent_timestamp:'2026-08-27T17:02:00.000Z'
};

test('CoverageFit version and forward sync contracts identify the exact upstream release', () => {
  const pkg = json('package.json');
  const contract = json('contracts/CF_408_IDENTITY_SYNC_1_0_CONTRACT.json');
  const upstream = json('contracts/408_IDENTITY_1_10_INTERFACE_SNAPSHOT.json');
  assert.equal(pkg.version, '3.20.204');
  assert.equal(contract.build, 'CF-408-IDENTITY-SYNC-1.0');
  assert.equal(contract.upstream_identity_contract, '408-IDENTITY-1.10');
  assert.equal(contract.upstream_archive_sha256, upstream.archive_sha256);
});

test('producer identity matches the agency-authority hierarchy', () => {
  const producer = json('producer.json');
  assert.equal(producer.name, 'Dylan Haysbert');
  assert.equal(producer.title, 'Insurance Producer');
  assert.equal(producer.license, 'CA License #4528400');
  assert.equal(producer.agency, 'Virginia Tam Insurance Agency, Inc.');
  assert.equal(producer.agencyAddress, '833 Corporate Way, Fremont, CA 94539');
  assert.equal(producer.carrierCredential, 'Farmers Insurance Authorized Agency');
  assert.equal(producer.agencyTextLine, '408-FARMERS');
  assert.equal(producer.identityContract, '408-IDENTITY-1.10');
});

test('all consumer HTML avoids presenting unhyphenated 408FARMERS as an entity', () => {
  assert.equal(runtimeHtml.length, 40);
  for (const file of runtimeHtml) {
    let source = fs.readFileSync(file, 'utf8');
    source = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    source = source.replace(/\s(?:data-[\w:-]+|href|value)=(?:"[^"]*"|'[^']*')/gi, '');
    assert.doesNotMatch(source, /408FARMERS/, path.relative(root, file));
    assert.doesNotMatch(source, /408-farmers-(?:nav-)?logo/i, path.relative(root, file));
  }
});

test('customer-visible handoff language names the agency rather than a 408FARMERS entity', () => {
  const sources = [
    'assets/js/pvx-host-aware.js', 'assets/js/contact-prefill.js', 'assets/js/property-confirmation.js',
    'assets/js/assessment-engine.js', 'assets/js/assessment-prefill.js', 'assets/js/transition-route.js',
    'assets/js/consultation-command-center.js', 'assets/js/agent-workspace.js', 'server/pvx-customer-producer-status-core.mjs'
  ].map(read).join('\n');
  for (const forbidden of ['Dylan at 408FARMERS', '408FARMERS information', '408FARMERS intake', '408FARMERS handoff', '408FARMERS web', 'on 408FARMERS']) {
    assert.equal(sources.includes(forbidden), false, forbidden);
  }
  assert.match(sources, /Virginia Tam Insurance Agency, Inc\./);
  assert.match(sources, /CA License #4528400/);
});

test('secure TECH mapping carries the identity presentation contract without changing consent semantics', () => {
  const mapping = mapWebToPvx(confirmedTech);
  assert.deepEqual(validateWebPvxMapping(mapping), { valid: true, errors: [] });
  assert.equal(COVERAGEFIT_IDENTITY_SYNC_BUILD, 'CF-408-IDENTITY-SYNC-1.0');
  assert.equal(UPSTREAM_IDENTITY_CONTRACT, '408-IDENTITY-1.10');
  assert.equal(mapping.presentation.identityContract, '408-IDENTITY-1.10');
  assert.equal(mapping.presentation.licensedAgency, 'Virginia Tam Insurance Agency, Inc.');
  assert.equal(mapping.presentation.contactMnemonic, '408-FARMERS');
  assert.equal(mapping.semantics.mnemonicIsLicensedEntity, false);
  assert.equal(mapping.semantics.acquisitionDomainIsLicensedEntity, false);
  assert.equal(mapping.consent.contact, false);
  assert.equal(mapping.consent.sms, false);
  assert.equal(mapping.consent.call, false);
  assert.equal(mapping.consent.email, false);
  assert.equal(mapping.semantics.phoneNumberIsSmsPermission, false);
  assert.equal(mapping.semantics.occupationProvesEligibility, false);
  assert.equal(mapping.semantics.bindAuthorized, false);
  assert.deepEqual(Object.keys(TECH_PVX_ROLES), json('contracts/408_IDENTITY_1_10_INTERFACE_SNAPSHOT.json').tech.roles);
});

test('HOME AUTO LIFE BUSINESS entry text remains byte-aligned with the upstream interface', () => {
  const upstream = json('contracts/408_IDENTITY_1_10_INTERFACE_SNAPSHOT.json');
  assert.deepEqual(SMS_LINK_ENTRY_MESSAGES, upstream.sms_entry_messages);
  assert.match(SMS_AUTOMATION_INTRO, /408-FARMERS, the memorable agency text line/);
  assert.match(SMS_AUTOMATION_INTRO, /Virginia Tam Insurance Agency, Inc\./);
  assert.match(SMS_AUTOMATION_INTRO, /Dylan Haysbert, Insurance Producer, CA License #4528400/);
});

test('technical domains, source identifiers, and host modes remain compatible', () => {
  const technical = [read('server/pvx-web-journey-core.mjs'), read('server/web-pvx-mapping-core.mjs'), read('assets/js/pvx-host-aware.js'), read('assets/js/pvx-web-bootstrap.js')].join('\n');
  for (const expected of ['https://408farmers.com', 'https://review.408farmers.com', '408farmers_web', '408farmers_tech_checkpoint', "'408farmers'", 'TECH-PVX-1.10']) assert.match(technical, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('identity synchronization adds no customer PII to URLs or analytics', () => {
  const source = [read('assets/js/pvx-web-bootstrap.js'), read('server/web-pvx-mapping-core.mjs')].join('\n');
  assert.doesNotMatch(source, /searchParams\.set\(['"](?:first_name|mobile|phone|email|address|consent)/);
  assert.doesNotMatch(source, /console\.(?:log|info|debug)\([^)]*(?:firstName|mobile|phone|email|address)/i);
});

test('external 408FARMERS release matches the checked-in interface snapshot when supplied', () => {
  const farmersRoot = process.env.FARMERS_ROOT;
  if (!farmersRoot) return;

  const upstream = json('contracts/408_IDENTITY_1_10_INTERFACE_SNAPSHOT.json');
  const worker = fs.readFileSync(path.join(farmersRoot, '_worker.js'), 'utf8');
  const techContract = fs.readFileSync(path.join(farmersRoot, 'assets/js/tech-pvx-contract-1.10.js'), 'utf8');
  const identity = JSON.parse(fs.readFileSync(path.join(farmersRoot, 'contracts/408-identity-1.2-contract.json'), 'utf8'));

  for (const [kind, message] of Object.entries(upstream.sms_entry_messages)) {
    const route = `/text/${kind}`;
    assert.match(worker, new RegExp(`${route.replace('/', '\\/')}['"]:\\s*${JSON.stringify(message).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
  assert.match(techContract, new RegExp(upstream.bootstrap_endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(identity.release, upstream.release);
  const hierarchy = Object.fromEntries(identity.consumer_hierarchy.map(entry => [entry.role, entry]));
  assert.equal(hierarchy.licensed_agency.value, 'Virginia Tam Insurance Agency, Inc.');
  assert.equal(hierarchy.producer.license, 'CA License #4528400');
  assert.equal(hierarchy.contact_mnemonic.value, '408-FARMERS');
});
