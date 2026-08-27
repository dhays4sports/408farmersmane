# CF-408-IDENTITY-SYNC-1.0 Completion Report

## Outcome

CoverageFit v3.20.204 is synchronized with the 408FARMERS `408-IDENTITY-1.10` release. The integration preserves the established technical identifiers and behavioral contracts while presenting the actual agency and producer relationship accurately.

The production hierarchy is:

1. Farmers Insurance Authorized Agency credential.
2. Virginia Tam Insurance Agency, Inc.
3. Dylan Haysbert, Insurance Producer, CA License #4528400.
4. CoverageFit as the review experience.
5. 408-FARMERS as the memorable agency phone/text mnemonic.
6. 408farmers.com as the acquisition domain.

## Integrity

| Artifact | SHA-256 |
|---|---|
| CoverageFit v3.20.203 baseline ZIP | `29a8d7df8e5986c1ac9e4ea6bcf9863b4487b1eb4277a9bec0269245a508d6ee` |
| 408-IDENTITY-1.10 upstream ZIP | `4f9c8a33d40a986a6ad834ee68f1201e98b5da5c4d2b19158351142f157db3b4` |

The final archive hash is recorded in the separately delivered SHA-256 manifest to avoid circular archive hashing.

## What changed

- CoverageFit package metadata advanced from 3.20.203 to 3.20.204.
- The forward contract `CF-408-IDENTITY-SYNC-1.0` binds CoverageFit to the exact upstream identity, SMS, and TECH interfaces.
- Producer configuration now includes the licensed agency, address, Farmers Authorized Agency credential, 408-FARMERS mnemonic explanation, upstream identity contract, and sync build.
- Consumer handoff, progress, contact, assessment, transition, print, and customer-status language now names Virginia Tam Insurance Agency, Inc. and Dylan accurately.
- The SMS automation introduction explains 408-FARMERS as the memorable agency text line and identifies Dylan and his license.
- The secure TECH mapping carries a bounded presentation contract while retaining all existing technical values and consent semantics.
- Runtime operations labels describe an agency text-line operation instead of presenting 408FARMERS as a company.

## Cross-repository synchronization

The actual 408-IDENTITY-1.10 release was compared with CoverageFit, not merely a copied specification. The following matched:

- the exact HOME, AUTO, LIFE, and BUSINESS prefilled messages;
- `https://review.408farmers.com/api/pvx/web-bootstrap`;
- the `408-IDENTITY-1.10` release marker;
- Virginia Tam Insurance Agency, Inc.;
- Dylan Haysbert and CA License #4528400;
- the 408-FARMERS mnemonic contract.

The four SMS workflows remain bounded. HOME enters the inherited home review; AUTO avoids VIN and driver-license collection; LIFE avoids health and financial data; BUSINESS collects only bounded intake context. STOP, suppression, producer ownership, replay protection, and RingCentral deduplication remain authoritative.

## TECH-PVX continuity

- Secure bootstrap remains POST-only, allowed-origin bound, 16 KB body limited, cookie-secure, and idempotent.
- No contact PII is placed in the visible URL.
- The seven bounded technology roles survive the handoff without implying eligibility.
- Confirmed early identity remains reusable without becoming SMS/call/email permission.
- Skipped journeys remain anonymous.
- Homeowner and renter Snapshot paths remain intact.
- Known identity is reused later; anonymous contact requests do not silently merge identity.
- Passive Snapshot completion does not create a producer notification.

## Identity occurrence audit

All 40 runtime HTML pages contain zero consumer-visible uses of unhyphenated `408FARMERS` as an entity. Eleven retained non-consumer occurrences are compatibility or historical engineering labels: two CSS comments, one source comment, seven internal producer-notification subjects, and one simulator fixture string. The producer subjects are preserved because the inherited RC-SMS regression contract asserts them and they are not consumer-facing identity surfaces.

Preserved technical identifiers include `408farmers.com`, `review.408farmers.com`, `408farmers_web`, `408farmers_sms`, `408farmers_tech`, `408farmers_tech_checkpoint`, `408farmers-prefill`, `hostMode=408farmers`, campaign/UTM values, storage/event identifiers, TECH-PVX-1.10, and RC-SMS-1.9.7.

## Tests

```sh
npm run test:408-identity-sync
npm run test:sms-entry-points
npm run test:tech-pvx-1.0
npm run test:tech-pvx-1.10
FARMERS_ROOT=/path/to/408-IDENTITY-1.10 node --test tests/408-identity-1.10-sync.test.mjs
FARMERS_ROOT=/path/to/408-IDENTITY-1.10 node --test tests/*.js tests/*.mjs tests/*.cjs
find assets/js server functions workers -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
```

Results: 55/55 Node tests passed, 184/184 embedded certification checks passed, 9/9 cross-repository sync checks passed, 761/761 internal HTML references resolved, and all JavaScript syntax checks passed. The environment-dependent historical focused-sprint selector was intentionally not selected and was not a failed test.

The inherited `CF-ADV-3.3` mobile/accessibility/performance source certification passed 15/15 with 42,930 critical bytes against a 250,000-byte budget. A local Chromium binary was unavailable; the changes do not modify CSS, assets, controls, framework dependencies, or layout structure. Representative-device checks remain part of the deployment canary.

## External deployment dependencies

- Deploy the synchronized 408-IDENTITY-1.10 acquisition release and this CoverageFit release as a coordinated pair.
- Preserve the existing Cloudflare Pages bindings, D1/KV stores, rate-limit configuration, secure-cookie environment, RingCentral credentials/webhook registration, producer access configuration, and notification destinations.
- Keep `review.408farmers.com` routed to CoverageFit and `408farmers.com` routed to the agency acquisition release.
- Do not change the approved SMS number or the exact four prefilled starter messages without advancing both interface contracts.

## Rollback

Rollback is a whole-artifact redeploy of the verified v3.20.203 baseline. Do not selectively revert the SMS consent, bootstrap, storage, or producer-record components. If only the acquisition release is rolled back, also roll CoverageFit back to the matching prior interface pair or disable the mismatched entry campaign until both sides are aligned.

