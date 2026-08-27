# CF-DISP-0.2 — Displacement Facts, Identity + Claims Contract

## Purpose
Creates source-governed Safeco/Liberty factual claims, non-affiliation identity rules, and explicit forbidden claims.

## Baseline
- CoverageFit: `3.20.200`
- Immutable source SHA-256: `cefd2d7b52bdc2a818941e981b9e867e08b1a14ccee17cd69d4a782eb2c7ba13`
- Program overlay: `CF-DISP-5.2`

## Implemented product surfaces
- `cf-disp/CARRIER_FACT_REGISTRY.json` — present — `73db78f58e64dddeb943d4ad01b62ce6f3b641024bfb1a22ecd803f8021f5fad`
- `nonrenewal/safeco/index.html` — present — `6791a3a0e2f7bab2b1580e664ae0763b22199c8577229f7960a5832f6a037ece`

## Governing boundaries
- Displacement urgency is operational, not an underwriting or consumer lead score.
- Carrier/search/campaign context does not create Protection Score, eligibility, pricing, bindability, recommendation buy-in, or action readiness.
- Contact and channel permissions remain explicit and independent.
- Existing PVX/Home/Policy/Workspace systems are extended rather than forked.

## Focused QA
Configuration: `qa/cf-disp/config/CF_DISP_0_2_QA.json`
Result: `qa/cf-disp/results/CF_DISP_0_2_QA_RESULT.json`
Global behavioral suite: `CF_DISP_FOCUSED_QA.mjs`

## Regression gate
Normalized comparison is against the frozen baseline of **305 discovered / 208 passing / 97 historical failures**. Final program state is **306 / 209 / 97**, so this sprint introduces no unexplained regression failure in the final integrated candidate.

## Rollback
See `cf-disp/releases/CF_DISP_0_2_ROLLBACK.md`. Rollback is additive-first: remove/revert the sprint-owned integration while preserving the immutable v3.20.200 baseline semantics.
