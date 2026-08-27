# CF-DISP-2.4 Release Highlights

## Urgency-Aware Follow-Up + Deeper Continuation
Reuses the existing queue/continuation/checkpoint mechanisms and lets deadlines prioritize already-actionable records without bypassing consent.

Primary implementation:
- `server/pvx-producer-action-queue-core.mjs`
- `assets/js/displacement-context.js`
- `server/pvx-checkpoint-core.mjs`

Acceptance result: complete in the integrated `CF-DISP-5.2` production candidate.
