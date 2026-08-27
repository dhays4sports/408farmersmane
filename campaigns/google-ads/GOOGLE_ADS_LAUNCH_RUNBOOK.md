# CF-DISP Google Ads launch runbook

## Launch posture
Start with Search only. Use exact and phrase match. Do not enable Display expansion or Performance Max for the initial learning phase. Keep competitor trademarks in keyword targeting; keep the responsive-search-ad copy carrier-neutral unless counsel/policy review specifically approves otherwise.

## Suggested initial operating budget
Start in the $30–$50/day range across the two campaigns, then reallocate based on qualified producer conversations and quotes rather than raw form fills. This is an operating test budget, not a promise of economics.

## Conversion hierarchy
1. Lead — explicit contact checkpoint.
2. Qualified Lead — producer conversation completed.
3. Quote Started.
4. Quote Delivered.
5. Policy Bound.

Use qualified/converted lead goals for bidding when conversion volume is sufficient. Keep intake starts and raw form submissions as observation diagnostics rather than the primary optimization target.

## Current Google measurement requirement (reviewed 2026-08-24)
Google states that starting June 15, 2026, offline conversion and enhanced-conversions-for-leads uploads are migrated to the Data Manager API and blocked in the Google Ads API except for specified legacy access. Use Google Ads Data Manager / Data Manager API for current and future uploads. Capture GCLID/GBRAID where available and provide permitted first-party match data through the dedicated conversion-import path, not general analytics.

Official references:
- https://support.google.com/google-ads/answer/15713840
- https://support.google.com/google-ads-data-manager/answer/14184381
- https://support.google.com/google-ads/answer/11021502

## Trademark guardrail
Google's published trademark policy states that using trademarks as keywords is not restricted merely because they are trademarks, while use of a direct competitor's trademark in ad text can be restricted after a complaint. The landing page must clearly identify CoverageFit / Virginia Tam Insurance Agency, Inc. and must not imply Safeco/Liberty affiliation.

Official reference:
- https://support.google.com/adspolicy/answer/6118

## Search-term cadence
Review search terms daily during the first two weeks, then at least twice weekly until the query mix is stable. Add negatives immediately for servicing/login/employment/research intent. Promote exact-match terms only after they demonstrate downstream quality.

## Expansion rule
A query theme becomes an SEO/content candidate only when it has repeated relevant traffic plus downstream engagement/qualified-lead evidence. It never auto-publishes.

## Stop/loss rule
Pause an ad group when spend materially exceeds the agency's acceptable acquisition cost without producing qualified conversations or quote starts. Do not judge only by CTR or lead form volume.

## Included launch artifacts
- `CAMPAIGN_SETTINGS.csv` — California-only Search settings and initial $45/day split test.
- `CAMPAIGN_STRUCTURE.csv` — campaign/ad-group/landing mapping.
- `KEYWORDS.csv` — 37 exact/phrase high-intent starting keywords.
- `NEGATIVE_KEYWORDS.txt` — servicing, employment, unrelated-line and research exclusions.
- `RSA_COPY.csv` — 15 headlines + 4 descriptions per campaign family; all headline/description lengths checked against 30/90-character limits.
- `SITELINKS_CALLOUTS.csv` — supporting assets.
- `CONVERSION_MAP.csv` — CoverageFit → Google outcome mapping.
- `UTM_CONVENTIONS.md` — manual attribution convention while preserving Google auto-tagging.
- `SEARCH_TERM_REVIEW_TEMPLATE.csv` — downstream-quality review sheet.
- `LAUNCH_CHECKLIST.md` — account-side preflight.
