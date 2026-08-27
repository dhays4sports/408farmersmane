# CF-DISP UTM + Google click-ID convention

Use Google Ads auto-tagging so `gclid`, `gbraid`, or `wbraid` can be supplied by Google where applicable. Do not fabricate those identifiers in manual URL templates.

Recommended final URL suffix / tracking template fields:

- `utm_source=google`
- `utm_medium=cpc`
- `utm_campaign=cf_disp_safeco_ca` or `cf_disp_generic_nonrenewal_ca`
- `utm_term={keyword}`
- `utm_content={creative}`
- `source=google_ads`
- `entry=nonrenewal`

The CoverageFit attribution module stores bounded first-touch and session-touch values. Do not place name, email, phone, property address, notice text, or other contact PII in UTMs.
