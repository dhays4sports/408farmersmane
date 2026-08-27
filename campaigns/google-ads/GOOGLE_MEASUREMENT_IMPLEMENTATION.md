# Google Ads measurement implementation — CF-DISP

CoverageFit captures Google click identifiers in the first-touch and session-touch attribution payload. General analytics deliberately excludes contact PII. Contact data stays in the secure CoverageFit checkpoint record.

For enhanced conversions for leads / offline outcomes, use the dedicated Data Manager path. `server/displacement-conversion-core.mjs` creates a Data Manager-shaped row and separate SHA-256 match diagnostics. Do not send that object to `dataLayer` or the general PVX event endpoint.

Recommended Data Manager fields: Conversion action, Conversion date and time, Event source, GCLID/GBRAID where available, email or E.164 phone as permitted, Order ID/checkpoint ID, optional value/currency, and consent state.

Outcome mapping:
- `disp_contact_requested` → Lead
- `producer_conversation_completed` → Qualified Lead
- `quote_started` → Quote Started
- `quote_delivered` → Quote Delivered
- `policy_bound` → Policy Bound

The final Google Ads UI connection, account IDs, conversion-action resource IDs, customer-data terms acceptance and live Data Manager schedule remain operator actions because the source package has no authenticated Google Ads account connection.
