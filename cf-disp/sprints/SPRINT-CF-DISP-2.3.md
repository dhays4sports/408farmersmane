# CF-DISP-2.3 — Agent Workspace Integration

## Purpose
Adds a concise displacement panel to the existing Workspace so producers do not reconstruct the story from disconnected records.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `agent/workspace/index.html` — present — `422aff0be9219d573d37a2685028b82e64600786fccfe1326432c82d4bc46bcd`
- `assets/js/agent-workspace.js` — present — `d26a1ba49f0bee948d10316a9721280ded9b5d5e36133921a6adbc2f42b6928d`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_2_3_QA.json`
Result: `qa/cf-disp/results/CF_DISP_2_3_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_2_3_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
