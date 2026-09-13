# GA4 contact and listing creation measurement

Production uses `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`. The existing stream is
`G-SL2JTL4WE7`. Development builds do not load GA4.

`DeferredGoogleAnalytics` initializes the Google-compatible queue immediately
after hydration and loads gtag during idle time, within two seconds, or on the
first interaction. A contact event is queued before requesting the tag. There
is one initial config/page view; SPA views use GA4 Enhanced Measurement history
tracking. Do not add a manual page-view listener without changing that setting.

## Event contract

`contact_click` measures intent to contact, not a completed call, conversation,
qualified lead or sale. It covers native telephone links and HTTPS links on
`line.me`, `www.line.me` and `lin.ee`, including portal-based mobile contacts and
gallery dialogs. Link navigation is not prevented or delayed.

| Event parameter | Meaning |
| --- | --- |
| `contact_method` | `phone` or `line` |
| `contact_surface` | `listing_page`, `map_modal`, `mobile_contact_sheet`, `gallery`, `organization`, or `site` |
| `listing_id` | Public listing UUID when available; public detail-route slug as fallback |
| `property_type` | Existing property taxonomy code when available |
| `organization_id` | Public organization UUID on organization profiles |

The custom event does not include the target URL, phone number, LINE handle,
email, contact name or form data. Its page URL excludes query strings and hash.
Private account/admin/auth/payment routes are excluded. Existing automatic GA4
measurement is separate from this custom event; review its settings in GA4.
Use `data-analytics-ignore` on any future contact area that must be excluded.

## Account setup

Confirmed by the owner on 2026-09-13: `contact_click` is a key event, it is
received in Realtime, and event-scoped dimensions `contact_method`,
`contact_surface`, `listing_id` and `property_type` are registered. Do not
recreate these. Contact Exploration and Search Console linking still need
account-side confirmation.

1. Confirm the selected web stream has measurement ID `G-SL2JTL4WE7` and receives
   `page_view` and `contact_click` in Realtime/DebugView after a real test.
2. Mark the existing `contact_click` event as a key event. Do not create another
   rule that duplicates the same event. Treat it as contact intent in reports.
3. Create event-scoped custom dimensions with the exact parameter names above.
   Start with method, surface, property type and listing ID. Organization ID is
   useful when comparing agency profiles. Monitor listing-ID cardinality as the
   site grows; use exported raw data if detailed reports aggregate into `(other)`.
4. Confirm Enhanced Measurement > Page views includes browser-history changes.
5. Check Admin > Product links > Search Console links for the verified
   `https://mapxprop.com/` property and this web stream. Do not add a duplicate.
6. Build an Exploration filtered to `event_name = contact_click`, with rows for
   listing ID and contact method, columns for session source/medium, and event
   count/total users. Clicks are not unique inquiries.

GA4 dimensions may take 24–48 hours to become reportable after setup and new
traffic. Browser delivery checks do not prove report processing or account-side
configuration. Ad blockers, consent choices and browser navigation may prevent
delivery; queuing does not guarantee every click is received.

References: [GA4 events](https://developers.google.com/analytics/devguides/collection/ga4/events),
[SPA page views](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications),
[key events](https://support.google.com/analytics/answer/13128484),
[custom dimensions](https://support.google.com/analytics/answer/14240153?hl=en),
[Search Console integration](https://support.google.com/analytics/answer/10737381?hl=en).

## QA

Run the Node tests and TypeScript check before deployment. Browser QA should
intercept Analytics collector requests and prevent external contact navigation
only in the QA browser, avoiding artificial production conversions or calls.
Check one config, one custom event per click, portal context and SPA navigation.

## Listing creation funnel

The listing wizard sends distinct event names, so its basic funnel does not
require additional custom dimensions. Existing `property_type` and `listing_id`
dimensions are reused when present.

| User action | New listing event |
| --- | --- |
| Step 1: property type, listing title and description form becomes ready | `listing_create_step_1` |
| Step 2: location and property details form becomes ready | `listing_create_step_2` |
| Step 3: media, pricing and contact form becomes ready | `listing_create_step_3` |
| Step 4: valid draft enters upload/save processing | `listing_create_step_4` |
| API confirms a saved listing with a public ID and slug | `listing_create_success` |
| Guest reaches the sign-in checkpoint after submitting step 1 | `listing_create_auth_required` |
| Submission fails a gate, upload, save, or local finalization | `listing_create_error` |

Editing an existing listing emits `listing_edit_*` equivalents. Those events
are intentionally excluded from the new listing funnel. A restored success
screen emits neither a fresh step-4 entry nor another conversion. Retries in
the same mounted processing screen do not repeat its step view. Confirmed
saves are deduplicated by public listing, flow and local submission key across
retries/reloads using session storage, with memory fallback when unavailable.
These browser events are not a substitute for authoritative database totals.

Step views wait for the actual form to load behind authentication and cloud
draft synchronization. Effect replay and re-renders do not create new views;
returning to a previously visited step does. Invalid direct visits to step 4
produce a diagnostic and redirect without a step-4 view. Drop-off is inferred
from the funnel, not an unreliable browser-unload event.

Parameters are restricted to `flow_mode` (`create`/`edit`), `step_number`,
`step_name` (`property_type`, `details`, `media_price_contact`, `upload_publish`),
optional controlled `property_type`, and public `listing_id` on success only.
Errors add `failure_stage`: `missing_draft`, `validation`, `files`, `upload`,
`publish`, or `finalize`. Finalize means the API succeeded but browser cleanup
failed; it does not negate a confirmed save. The submission key stays local.
Custom events contain no form values, title, description, phone, email, precise
location, filenames or raw error text. Step 1 may have no property type yet.

### GA4 report setup

1. In Events, mark only `listing_create_success` as an additional key event
   (no monetary value, once per event). If it has not appeared yet, use Create
   event > Create with code and that exact name. Do not derive it from a
   `page_view`, `form_submit`, or `click` rule. The website emits it already.
2. Explore > Funnel exploration, name it "Listing creation — 4 steps".
3. Edit Steps, remove template conditions, and use exact **Event name** matches
   for `listing_create_step_1`, `_step_2`, `_step_3`, `_step_4` in order, followed
   by `listing_create_success` as the completion outcome (not a fifth UI step).
4. Use a **closed funnel** and **indirectly followed by** so auth, autosaves and
   other events between steps do not break the sequence. Leave time limits
   unset initially. Use Device category for the mobile/tablet/desktop breakdown.
5. Select a date range after deployment. GA4 reporting may need 24–48 hours for
   new data. Realtime can confirm event delivery sooner. Funnel users are not
   raw event counts or numbers of listing submissions; it uses qualifying user
   sequences. A separate open funnel can examine users resuming drafts at step 2.

Do not register extra step dimensions just to construct this report: distinct
event names provide its conditions. Register optional `failure_stage` only if
building a diagnostic report that needs that breakdown.

Reference: [GA4 Funnel exploration](https://support.google.com/analytics/answer/9327974?hl=en).

### Funnel QA

`tests/listing-funnel-analytics.test.cjs` exercises queued events, taxonomy/PII
filtering, create/edit separation, lifecycle replay, reload deduplication and
the actual step-4 submission callback with mocked APIs. It verifies delayed
success, retry, missing files, upload/save failure and restored success.
Post-deploy browser QA must intercept all API writes and Analytics collectors
in an isolated profile; do not publish test listings or create fake conversions
in the live account.
