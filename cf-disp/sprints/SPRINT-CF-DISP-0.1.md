# CF-DISP-0.1 — Baseline, Regression + Migration Boundary

## Purpose
Freezes the exact v3.20.200 source hash, historical regression state, protected surfaces, and additive migration boundary before product changes.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `cf-disp/baseline/BASELINE_REGRESSION.json` — present — `200fd024f212ff20fe7d557f98fb7cc18e7a9ccd47f66bfc42d54ae64b92609e`
- `cf-disp/baseline/PROTECTED_HASHES_BASELINE.sha256` — present — `daf82cb1eff9d02cc9142d7a1a024e40ea8105ab58c0aec3a0f9b4f148fbc3f4`
- `CF_DISP_BUILD.json` — present — `d5bfa3af7245c69511f77284c0fff2c1faf2d40d4e3b333c94c5616c4905f6d2`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_0_1_QA.json`
Result: `qa/cf-disp/results/CF_DISP_0_1_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_0_1_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
