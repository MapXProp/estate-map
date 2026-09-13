# GA4 contact measurement

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

## Account setup still requiring GA4 access

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
