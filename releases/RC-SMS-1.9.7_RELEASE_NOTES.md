# RC-SMS-1.9.7 — 408FARMERS Entry-Point Intake

CoverageFit version: **3.20.203**  
Baseline: `CoverageFit_v3.20.202_TECH-PVX-1.10_DEPLOYMENT_SLIM_ROOT_CRITICAL_ONLY(1).zip`  
Baseline SHA-256: `3644cd55464991c0aa2906c6959ba31b524fdf7d82b6d377fdd967ff9117967c`

## Baseline finding

Before this release, each exact 408FARMERS starter message—HOME, AUTO, LIFE, and BUSINESS—resolved to `ambiguous_shared_number_inbound`. The live orchestrator transferred those messages to producer ownership without sending an automated intake response.

## Released behavior

- `HOME` enters the inherited current-home SMS workflow, collects the property address and review reason, and then uses the existing secure CoverageFit handoff.
- `AUTO` collects bounded vehicle count, driver count, and review reason, then upgrades the same SMS relationship to producer-ready handling.
- `LIFE` collects a bounded protection goal and who is being considered for coverage, then upgrades the same SMS relationship to producer-ready handling.
- `BUSINESS` collects a bounded industry category and coverage need, then upgrades the same SMS relationship to producer-ready handling.
- All four exact messages are synchronized byte-for-byte with the 408FARMERS `/text/home`, `/text/auto`, `/text/life`, and `/text/business` source contract.
- AUTO, LIFE, and BUSINESS do not enter the home PVX or receive a fabricated Snapshot. They remain producer-safe SMS intake records in the existing SMS Operations and producer-alert architecture.
- Existing HOME, homebuyer, bundle, realtor attribution, secure handoff, producer ownership, retry, webhook idempotency, STOP/START, provider suppression, and TECH-PVX behavior are preserved.

## Consent and semantic boundaries

- A customer-initiated inbound SMS permits the requested transactional intake response; it is not treated as automated marketing consent.
- The inbound message does not create call permission, email permission, a quote request, eligibility, underwriting approval, bind authorization, or guaranteed savings.
- STOP and provider suppression remain authoritative.
- A producer-owned conversation is never silently reclaimed by automation, even if a new entry message arrives.
- Intake answers remain customer-reported and unverified.

## Privacy boundaries

- Entry-point metadata is bounded to `home`, `auto`, `life`, or `business`.
- Producer email alerts identify the line of business but omit phone number and transcript content.
- AUTO prompts tell customers not to send VINs or driver-license numbers.
- LIFE prompts tell customers not to send health details, Social Security numbers, or financial-account information.
- BUSINESS prompts tell customers not to send EINs, customer information, or account numbers.

## Validation

- Focused RC-SMS entry-point suite: `11/11` passed.
- Complete deployed-slim test suite: `46/46` passed.
- TECH-PVX-1.0 supported gate: `5/5` passed.
- TECH-PVX-1.10 supported gate: `14/14` passed.
- Live-style RingCentral webhook test confirms outbound response, persistent progression, producer alert, and duplicate-event suppression without external network calls.
- Cross-repository source comparison confirms all four starter messages match the 408FARMERS package.

Commands:

```sh
npm run test:sms-entry-points
npm run test:tech-pvx-1.0
npm run test:tech-pvx-1.10
node --test tests/*.js tests/*.cjs tests/*.mjs
```

## Deployment dependencies

1. Deploy this archive to the CoverageFit Cloudflare Pages project serving `review.408farmers.com`.
2. Preserve the existing CoverageFit D1/store bindings and RingCentral credentials.
3. Confirm `RINGCENTRAL_FROM_NUMBER=+14083276377` and the live RingCentral webhook subscription targets the deployed endpoint.
4. Preserve the existing producer-alert configuration if privacy-safe email alerts are desired.
5. Deploy the synchronized 408FARMERS save-contact-and-text-links archive.
6. Run the four live mobile canaries below. Application certification does not replace carrier delivery verification.

## Live canaries

1. Open each 408FARMERS `/text/...` link on a phone, send the prefilled message, and verify the expected first question.
2. Complete one AUTO, LIFE, and BUSINESS intake and verify each appears once in SMS Operations with the correct producer-alert intent.
3. Complete HOME and verify the secure CoverageFit continuation link is delivered.
4. Resend one identical RingCentral event identifier and verify no duplicate reply or producer alert.
5. Send STOP during each workflow and verify no further automated reply is sent until the channel is legitimately restored.

The inherited carrier-port certification boundary remains unchanged: live sender assignment and carrier behavior require external production verification.
