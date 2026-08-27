# CF-DISP-2.2 — Producer Displacement Brief + Action Alert

## Purpose
Carries carrier/deadline/reason/urgency into the existing producer record and brief without creating a producer eligibility decision.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `server/pvx-unified-producer-record-core.mjs` — present — `24300ec02b4a0ae5f9d7168daaa25eebc8cd843afe9b49f622b9e51b9e853a67`
- `server/pvx-producer-brief-core.mjs` — present — `792a34640f924b2a4ea4b99e5d7d6b5b2dd463d0cebeca705b9624ff60f008b8`
- `server/pvx-producer-action-queue-core.mjs` — present — `6d815609dc8b62e8a8394ef832b9d1548c230b16f469b25b0eba2108dc668348`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_2_2_QA.json`
Result: `qa/cf-disp/results/CF_DISP_2_2_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_2_2_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
