# CF-DISP-1.1 — Search Intent + Attribution Extension

## Purpose
Extends first-touch/session attribution to preserve current Google click identifiers and displacement campaign context while keeping PII out of analytics.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `assets/js/attribution.js` — present — `fed970b9f81f608519aae23a89627487bfe3fa5a1991ee0ab303a2920740313c`
- `contracts/CF_DISP_CONTEXT_CONTRACT.json` — present — `1dd1e618fcb7a2d33857e12ade9034253876515c3759802897f62ea282d651a0`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_1_1_QA.json`
Result: `qa/cf-disp/results/CF_DISP_1_1_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_1_1_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
