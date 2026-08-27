# CF-DISP-1.0 — Displacement Context Contract + Carrier Registry

## Purpose
Introduces one reusable displacement context and carrier registry without forking PVX or any scoring/recommendation engine.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `contracts/CF_DISP_CONTEXT_CONTRACT.json` — present — `1dd1e618fcb7a2d33857e12ade9034253876515c3759802897f62ea282d651a0`
- `assets/js/displacement-carriers.js` — present — `204a027537a694d09bbe841442a0c732ca27fe7e8f33b313f2f2df359cc8e910`
- `assets/js/displacement-context.js` — present — `6ba202ca3f7454c71c3e0c0f91f14d7712c6a3312f04147990db7733bea58e7d`
- `server/pvx-displacement-core.mjs` — present — `00d51d3929dfb810bae0e731ea00f54e7ec1006dea626a29dcdb7a70e37ac03f`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_1_0_QA.json`
Result: `qa/cf-disp/results/CF_DISP_1_0_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_1_0_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
