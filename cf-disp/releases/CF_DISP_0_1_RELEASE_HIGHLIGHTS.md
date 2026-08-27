# CF-DISP-0.1 Release Highlights

## Baseline, Regression + Migration Boundary
Freezes the exact v3.20.200 source hash, historical regression state, protected surfaces, and additive migration boundary before product changes.

Primary implementation:
- `cf-disp/baseline/BASELINE_REGRESSION.json`
- `cf-disp/baseline/PROTECTED_HASHES_BASELINE.sha256`
- `CF_DISP_BUILD.json`

Acceptance result: complete in the integrated `CF-DISP-5.2` production candidate.
