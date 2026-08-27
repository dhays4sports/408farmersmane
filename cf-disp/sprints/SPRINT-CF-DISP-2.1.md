# CF-DISP-2.1 — Value-First Contact Checkpoint + Consent

## Purpose
Reuses the secure Snapshot checkpoint, keeps contact/channel consent independent, and places the optional contact request after value.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `nonrenewal/index.html` — present — `0e7ba75c83efc245b57d94b567a70350b031c59c45518ce3860ea84095d77240`
- `nonrenewal/safeco/index.html` — present — `6791a3a0e2f7bab2b1580e664ae0763b22199c8577229f7960a5832f6a037ece`
- `assets/js/displacement-intake.js` — present — `efb879404a213a42699e25e314727e7eef3b88fa60a1a6eada6bd9f846397373`
- `server/pvx-checkpoint-core.mjs` — present — `e3868d0a4e4946d8f0d92ffd9def4f5a5c9d1b666e0bcf2349300f243a34d016`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_2_1_QA.json`
Result: `qa/cf-disp/results/CF_DISP_2_1_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_2_1_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
