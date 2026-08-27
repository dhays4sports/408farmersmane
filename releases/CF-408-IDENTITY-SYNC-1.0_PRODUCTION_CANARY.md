# CF-408-IDENTITY-SYNC-1.0 Production Canary

Run these checks after deploying the coordinated 408-IDENTITY-1.10 and CoverageFit v3.20.204 releases.

## Identity and routing

1. Open CoverageFit from the 408farmers.com TECH path. Confirm the transition names Virginia Tam Insurance Agency, Inc. and CoverageFit, not a 408FARMERS company.
2. Confirm customer progress identifies Dylan Haysbert, Insurance Producer, CA License #4528400.
3. Confirm `408-FARMERS` is described as the memorable agency text line and `408farmers.com` is presented as a domain.
4. At 320, 360, 390, and 430 px, verify the longer agency/producer labels wrap without horizontal overflow. Repeat at 200% text zoom, forced colors, and reduced motion.

## SMS entry points

On an iPhone and Android device, open each acquisition link and verify the destination is `(408) 327-6377` with exactly:

- HOME: `HOME: Hi Dylan, I'd like help reviewing my home insurance.`
- AUTO: `AUTO: Hi Dylan, I'd like help reviewing my auto insurance.`
- LIFE: `LIFE: Hi Dylan, I'd like help reviewing my life insurance options.`
- BUSINESS: `BUSINESS: Hi Dylan, I'd like help reviewing insurance for my business.`

Send one message for each type. Verify the CoverageFit reply uses the agency-authority introduction, the workflow stays within its bounded questions, and exactly one logical producer record/notification is created. Verify STOP suppresses automation and a replayed RingCentral webhook is deduplicated.

## TECH secure handoff

1. Complete a confirmed-capture homeowner journey. Confirm the browser URL contains no name, mobile, consent, or other PII. Confirm role, housing, attribution, and checkpoint correlation survive.
2. Complete a confirmed-capture renter journey. Confirm renter Snapshot value appears before contact and later producer contact reuses known identity.
3. Skip early capture as homeowner and renter. Confirm both remain anonymous through Snapshot and can request contact later without silent identity merging.
4. Double-submit the bootstrap. Confirm one journey is reused and the response reports idempotent reuse.
5. Submit a malformed professional role and an unapproved origin. Confirm rejection without eligibility inference or partial customer state.

## Safety and rollback trigger

Immediately rollback the coordinated pair if any canary shows PII in a URL/log/analytics event, contact or SMS permission inferred without evidence, duplicate logical lead/producer records, a professional role presented as eligibility, SMS suppression bypass, or a mismatch in the exact starter messages/bootstrap endpoint.

