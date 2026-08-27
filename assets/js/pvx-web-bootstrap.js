(function (root) {
  'use strict';
  const PROFILE_KEY = 'coveragefit_prospect_profile_v1';
  const ENTRY_KEY = 'coveragefit_pvx_entry_v1';
  const DISCOVERY_KEY = 'coveragefit_pvx_discovery_v1';
  const WEB_BRIDGE_KEY = 'coveragefit_pvx_web_bridge_v1';
  const clean = (value, max = 240) => String(value ?? '').trim().replace(/[<>\u0000-\u001f\u007f]/g, '').slice(0, max);
  const save = (storage, key, value) => { try { storage?.setItem?.(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const status = document.getElementById('pvxWebBootstrapStatus');
  const fallback = document.getElementById('pvxWebBootstrapFallback');

  fetch('/api/pvx/web-journey', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ action: 'load' })
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok || !data?.journey?.seed) throw new Error(data?.error?.message || 'Secure journey unavailable.');
    const journey = data.journey;
    const seed = journey.seed;
    const address = seed.entry?.address || {};
    const identity = seed.identity || {};
    const earlyConfirmed = identity.earlyCaptureStatus === 'confirmed' && identity.supplied === true;
    const profile = {
      version: '1.4',
      firstName: earlyConfirmed ? clean(identity.firstName, 80) : '', lastName: '',
      fullName: earlyConfirmed ? clean(identity.firstName, 80) : '',
      phone: earlyConfirmed ? clean(identity.mobile, 40) : '', email: '',
      propertyAddress: clean(address.formattedAddress),
      reviewContext: clean(seed.evidence?.exactCustomerWords || 'CoverageFit Snapshot', 120),
      contactPermission: { confirmed: false, status: 'not_requested', source: '408farmers_web', capturedAt: '' },
      agencyContactPermission: {
        confirmed: earlyConfirmed && seed.consent?.earlyAgencyContact?.agencyContact === true,
        status: earlyConfirmed ? 'early_fallback_permission' : 'not_supplied',
        version: earlyConfirmed ? clean(seed.consent?.earlyAgencyContact?.version, 100) : '',
        capturedAt: earlyConfirmed ? clean(seed.consent?.earlyAgencyContact?.timestamp, 40) : '',
        smsPermitted: false, callPermitted: false, emailPermitted: false,
        laterContactRequested: false
      },
      address: {
        formattedAddress: clean(address.formattedAddress), street: clean(address.line1, 120),
        city: clean(address.city, 80), state: clean(address.state, 2), postalCode: clean(address.postalCode, 10),
        country: 'US', selectionMethod: 'native_web'
      },
      integration: {
        source: clean(seed.attribution?.source || '408farmers_web', 80),
        entry: clean(seed.entry?.type, 40), assessment: 'pvx', handoffVersion: 'web-1',
        senderBuild: 'TECH-PVX-1.10', senderIdentityContract: clean(seed.presentation?.identityContract || '408-IDENTITY-1.10', 80), receiverIdentityBuild: clean(seed.presentation?.syncBuild || 'CF-408-IDENTITY-SYNC-1.0', 80), leadCaptured: earlyConfirmed, leadCaptureStatus: earlyConfirmed ? 'confirmed' : clean(identity.earlyCaptureStatus, 40) || 'not_requested', prefilled: true,
        campaign: clean(seed.attribution?.campaign, 160), campaignId: clean(seed.attribution?.campaignId, 180),
        partnerId: clean(seed.attribution?.partnerId, 64), partnerName: clean(seed.attribution?.partnerName, 100),
        referralId: clean(seed.attribution?.referralId, 120), pvxJourneyId: clean(journey.journeyId, 120),
        techLeadCheckpointId: clean(identity.techLeadCheckpointId, 90)
      },
      receivedAt: new Date().toISOString()
    };
    const entry = {
      schemaVersion: '1.0', contractId: 'coveragefit-pvx-frictionless-entry-v1', address,
      source: seed.entry?.source || '408farmers_web', campaign: seed.attribution?.campaign || '',
      currentStage: seed.journey?.resumeState?.exactStage || 'entry', updatedAt: new Date().toISOString()
    };
    const bridge = {
      schemaVersion: '1.0', build: 'TECH-PVX-1.10', journeyId: journey.journeyId,
      entry: seed.entry, context: seed.context, attribution: seed.attribution, evidence: seed.evidence,
      identity: identity, identityPresentation: seed.presentation, leadLifecycle: journey.leadLifecycle,
      reconciliation: seed.reconciliation, ownership: seed.ownership, consent: seed.consent, semantics: seed.semantics,
      createdAt: journey.createdAt
    };
    for (const storage of [root.sessionStorage, root.localStorage]) save(storage, PROFILE_KEY, profile);
    save(root.localStorage, ENTRY_KEY, entry);
    save(root.localStorage, DISCOVERY_KEY, seed.discovery);
    for (const storage of [root.sessionStorage, root.localStorage]) save(storage, WEB_BRIDGE_KEY, bridge);
    try { root.history.replaceState(root.history.state, document.title, root.location.pathname); } catch (_) {}
    if (status) status.textContent = 'Connected. Opening the first unfinished step…';
    root.location.replace(journey.destination || '/pvx/start/');
  }).catch(() => {
    if (status) status.textContent = 'This secure return could not be opened.';
    if (fallback) fallback.hidden = false;
    document.body.removeAttribute('aria-busy');
  });
})(window);
