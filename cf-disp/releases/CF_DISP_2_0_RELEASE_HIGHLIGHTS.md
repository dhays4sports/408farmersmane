# CF-DISP-2.0 Release Highlights

## Urgency Classification + Routing Contract
Adds operational-only immediate/active/planning/early/unclear urgency and uses it only as a same-state producer queue tiebreaker.

Primary implementation:
- `contracts/CF_DISP_ROUTING_CONTRACT.json`
- `server/pvx-displacement-core.mjs`
- `server/pvx-producer-action-queue-core.mjs`

Acceptance result: complete in the integrated `CF-DISP-5.2` production candidate.
