# CF-DISP-2.0 Rollback Notes

1. Stop routing new traffic to any surface introduced by this sprint if the issue is acquisition-only.
2. Revert the sprint-owned files listed in `SPRINT-CF-DISP-2.0.md` where they are additive.
3. For shared files, restore the immutable v3.20.200 baseline copy rather than hand-editing certified historical logic.
4. Re-run `node CF_DISP_FOCUSED_QA.mjs` and `node RUN_REGRESSION_SUITE.js`.
5. Require zero new unexplained failures against the frozen 305/208/97 baseline before re-cutting a deployable package.

Never solve a rollback by weakening Protection Score, readiness, consent, SMS, secure-token, recommendation, or report contracts.
