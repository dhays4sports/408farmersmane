# CF-DISP-2.0 — Urgency Classification + Routing Contract

## Purpose
Adds operational-only immediate/active/planning/early/unclear urgency and uses it only as a same-state producer queue tiebreaker.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `contracts/CF_DISP_ROUTING_CONTRACT.json` — present — `dad4a3d464b4b4fa1002c75c6c73596144183d92845c2638d7ec7b3087c37433`
- `server/pvx-displacement-core.mjs` — present — `00d51d3929dfb810bae0e731ea00f54e7ec1006dea626a29dcdb7a70e37ac03f`
- `server/pvx-producer-action-queue-core.mjs` — present — `6d815609dc8b62e8a8394ef832b9d1548c230b16f469b25b0eba2108dc668348`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_2_0_QA.json`
Result: `qa/cf-disp/results/CF_DISP_2_0_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_2_0_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
