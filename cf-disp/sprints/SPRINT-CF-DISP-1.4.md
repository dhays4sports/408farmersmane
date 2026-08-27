# CF-DISP-1.4 — Six-Question Displacement Intake

## Purpose
Implements the six-question mobile-first sequence for event, carrier, timing, property, ZIP, and customer-reported reason.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `assets/js/displacement-intake.js` — present — `efb879404a213a42699e25e314727e7eef3b88fa60a1a6eada6bd9f846397373`
- `assets/css/displacement.css` — present — `56d82ca827e284f8f7354f2ba344b440ccb0749270aefa8a723774c59ec3ce40`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_1_4_QA.json`
Result: `qa/cf-disp/results/CF_DISP_1_4_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_1_4_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
