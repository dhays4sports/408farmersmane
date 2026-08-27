const test = require('node:test');
const assert = require('node:assert/strict');
const contract = require('../assets/js/tech-pvx-contract-1.0.js');

test('CoverageFit: exact Puesto QR URLs are canonical and distinct', () => {
  const urls = ['a','b','c'].map(v => contract.canonicalPuestoUrl(v));
  assert.equal(new Set(urls.map(u => u.href)).size, 3);
  for (const [i, url] of urls.entries()) {
    const v = ['a','b','c'][i];
    assert.equal(url.pathname, '/tech/');
    assert.equal(url.searchParams.get('campaign_id'), 'occupation_tech_meta_v1');
    assert.equal(url.searchParams.get('campaign_variant'), 'puesto_' + v);
    assert.equal(url.searchParams.get('utm_source'), 'puesto');
    assert.equal(url.searchParams.get('utm_medium'), 'windshield_card');
    assert.equal(url.searchParams.get('utm_campaign'), 'santa_clara_tech');
    assert.equal(url.searchParams.get('utm_content'), 'variant_' + v);
  }
});

test('CoverageFit: role values are explicit and normalized', () => {
  assert.equal(contract.normalizeRole('Software / Engineering'), 'software_engineering');
  assert.equal(contract.roleLabel('it_cybersecurity'), 'IT / Cybersecurity');
  assert.equal(contract.normalizeRole('Chief Wizard'), '');
});

test('CoverageFit: owner handoff preserves attribution and role context', () => {
  const source='https://408farmers.com/tech/?campaign_id=occupation_tech_meta_v1&utm_source=puesto&utm_medium=windshield_card&utm_campaign=santa_clara_tech&utm_content=variant_a';
  const url=contract.buildContinuationUrl('/pvx/start/',source,contract.techContext('data_analytics','owner','home_snapshot'));
  assert.equal(url.pathname,'/pvx/start/');
  assert.equal(url.searchParams.get('utm_content'),'variant_a');
  assert.equal(url.searchParams.get('professional_program'),'technology');
  assert.equal(url.searchParams.get('professional_role'),'data_analytics');
  assert.equal(url.searchParams.get('occupancy'),'owner');
  assert.equal(url.searchParams.get('review_track'),'home_snapshot');
});

test('CoverageFit: renter handoff remains self-service before contact', () => {
  const source='https://408farmers.com/tech/?campaign_id=occupation_tech_meta_v1&utm_source=puesto&utm_medium=windshield_card&utm_campaign=santa_clara_tech&utm_content=variant_b';
  const url=contract.buildContinuationUrl('/pvx/start/',source,contract.techContext('design_ux','renter','renter_snapshot'));
  assert.equal(url.pathname,'/pvx/start/');
  assert.equal(url.searchParams.get('occupancy'),'renter');
  assert.equal(url.searchParams.get('review_track'),'renter_snapshot');
  assert.notEqual(url.pathname,'/contact/');
  assert.equal(url.searchParams.get('professional_role_label'),'Design / UX');
});

test('CoverageFit: context does not contain an eligibility conclusion', () => {
  const ctx=contract.techContext('software_engineering','owner','home_snapshot');
  for (const forbidden of ['eligible','eligibility','qualified','discount_confirmed','approved']) {
    assert.equal(Object.prototype.hasOwnProperty.call(ctx, forbidden), false);
  }
});
