/* TECH-PVX-1.0 — Professional Campaign Payoff + Renter Continuity
 * Shared, dependency-free campaign/context contract.
 * User-supplied professional context never represents a verified eligibility decision.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CoverageFitTechPVXContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var ROLE_LABELS = Object.freeze({"software_engineering": "Software / Engineering", "it_cybersecurity": "IT / Cybersecurity", "data_analytics": "Data / Analytics", "product_program": "Product / Program", "design_ux": "Design / UX", "tech_operations_support": "Tech Operations / Support", "other_tech": "Other Tech"});
  var CONTEXT_KEYS = Object.freeze(["campaign", "campaign_id", "campaign_variant", "creative", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "entry_context", "professional_program", "professional_role", "professional_role_label", "occupancy", "review_track"]);
  var CAMPAIGN_KEYS = Object.freeze(["campaign", "campaign_id", "campaign_variant", "creative", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);

  function clean(value, max) {
    if (value === null || value === undefined) return '';
    return String(value).trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max || 160);
  }

  function normalizeRole(value) {
    var raw = clean(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return Object.prototype.hasOwnProperty.call(ROLE_LABELS, raw) ? raw : '';
  }

  function roleLabel(value) {
    var role = normalizeRole(value);
    return role ? ROLE_LABELS[role] : '';
  }

  function readParams(input) {
    var url;
    try {
      url = input instanceof URL ? new URL(input.href) : new URL(input || (typeof location !== 'undefined' ? location.href : 'https://408farmers.com/tech/'), 'https://408farmers.com/tech/');
    } catch (e) {
      url = new URL('https://408farmers.com/tech/');
    }
    var out = {};
    CONTEXT_KEYS.forEach(function (key) {
      var value = clean(url.searchParams.get(key), 200);
      if (value) out[key] = value;
    });
    return out;
  }

  function preservedAttribution(input) {
    var all = readParams(input);
    var out = {};
    CAMPAIGN_KEYS.forEach(function (key) { if (all[key]) out[key] = all[key]; });
    return out;
  }

  function buildContinuationUrl(base, input, additions) {
    var url = new URL(base || '/pvx/start/', input || (typeof location !== 'undefined' ? location.href : 'https://408farmers.com/tech/'));
    var current = readParams(input);
    Object.keys(current).forEach(function (key) { url.searchParams.set(key, current[key]); });
    Object.keys(additions || {}).forEach(function (key) {
      var value = clean(additions[key], 200);
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    });
    return url;
  }

  function techContext(role, occupancy, reviewTrack) {
    var normalized = normalizeRole(role);
    var out = {
      entry_context: 'professional',
      professional_program: 'technology',
      occupancy: occupancy === 'renter' ? 'renter' : (occupancy === 'owner' ? 'owner' : ''),
      review_track: clean(reviewTrack, 80)
    };
    if (normalized) {
      out.professional_role = normalized;
      out.professional_role_label = ROLE_LABELS[normalized];
    }
    return out;
  }

  function canonicalPuestoUrl(variant, origin) {
    var v = clean(variant, 20).toLowerCase();
    if (!/^[abc]$/.test(v)) throw new Error('Variant must be a, b, or c.');
    var url = new URL('/tech/', origin || 'https://408farmers.com');
    url.searchParams.set('campaign_id', 'occupation_tech_meta_v1');
    url.searchParams.set('campaign_variant', 'puesto_' + v);
    url.searchParams.set('utm_source', 'puesto');
    url.searchParams.set('utm_medium', 'windshield_card');
    url.searchParams.set('utm_campaign', 'santa_clara_tech');
    url.searchParams.set('utm_content', 'variant_' + v);
    return url;
  }

  function isTechCampaign(input) {
    var params = readParams(input);
    return params.professional_program === 'technology' || params.campaign_id === 'occupation_tech_meta_v1' || /(^|_)tech($|_)/i.test(params.utm_campaign || '');
  }

  return Object.freeze({
    ROLE_LABELS: ROLE_LABELS,
    CONTEXT_KEYS: CONTEXT_KEYS,
    CAMPAIGN_KEYS: CAMPAIGN_KEYS,
    normalizeRole: normalizeRole,
    roleLabel: roleLabel,
    readParams: readParams,
    preservedAttribution: preservedAttribution,
    buildContinuationUrl: buildContinuationUrl,
    techContext: techContext,
    canonicalPuestoUrl: canonicalPuestoUrl,
    isTechCampaign: isTechCampaign
  });
});
