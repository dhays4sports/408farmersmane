# CF-DISP-1.5 — Immediate Displacement Snapshot + Zero-Repeat PVX Bridge

## Purpose
Produces timing value before contact, persists displacement state, pre-fills why-shopping context, and carries it through PVX/checkpoint/profile surfaces.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `assets/js/displacement-context.js` — present — `6ba202ca3f7454c71c3e0c0f91f14d7712c6a3312f04147990db7733bea58e7d`
- `assets/js/pvx-checkpoint.js` — present — `bdce10c49e0c3351281f8e6a44f025467b75e02ba6afe36753d05c0d973e4d67`
- `assets/js/pvx-checkpoint-view.js` — present — `96e75d9d47406decae683a487b3c62cb65c7f87eb7b2ff7ae687e9c6e9bdf289`
- `server/pvx-checkpoint-core.mjs` — present — `e3868d0a4e4946d8f0d92ffd9def4f5a5c9d1b666e0bcf2349300f243a34d016`
- `assets/js/assessment-engine.js` — present — `9c7432f9da3a23478da06447f9b8425c015929f9bb838023c585aeb6e3dfb5e3`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_1_5_QA.json`
Result: `qa/cf-disp/results/CF_DISP_1_5_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_1_5_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
