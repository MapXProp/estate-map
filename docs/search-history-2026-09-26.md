# Search history and preference signals — 26 September 2026

Actual search submissions from the homepage, header/mobile sheet, map and card catalogue now use one history store. A selected suggestion or submitted filter-only search counts; typing, opening a page, map panning and reloads do not. Quick navigation/category links are not tracked as search submissions.

## User behavior

- Show up to 8 distinct recent searches, with category/offer/budget context. Replaying a recent search restores its stored destination and filters. The map remains the primary search destination; catalogue searches retain their list destination.
- Guests keep history in their browser. Verified members use an account-specific cache and authenticated API, so history can follow the account to another device. Old browser-wide history migrates to the guest scope only. Guest history is never automatically attributed to a signed-in member.
- Keep at most 100 recent events per scope/account. Identical consecutive submissions within 10 seconds are suppressed. Event IDs make network retries idempotent.
- Clearing history from the empty search field clears the associated preference summary. Account clearing must succeed online; failure is shown rather than falsely claiming deletion. Clearing browser site data alone does not clear server history.
- Privacy and cookie pages describe this behavior, including selected-location coordinates versus device GPS. Their actual content revision is reflected in the sitemap. History is not sent to Google Analytics.

## API and data

Migration `0176_user_search_history.sql` in the Go repository adds `user_search_history` (JSON events scoped by internal user ID) and `user_search_history_state` (deletion revision). Both cascade on account deletion.

`GET`, `POST` and `DELETE /apix/me/search-history` require a verified access token and active session. The public `owner` UUID is an account-change guard, never a caller-selected database scope. All queries use the authenticated internal user ID. Responses are private/no-store.

- GET query: `owner`. Response: `events`, `revision`, `preferences`, `limit`.
- POST body: `{ owner, revision, events }`. Each event contains UUID `id`, actual `query` (empty for filter-only submissions), display `label`, canonical relative search `url`, `source` and `searchedAt` epoch milliseconds. Only map/catalogue paths and known search parameters are retained. Request/event sizes and timestamps are bounded.
- DELETE body: `{ owner, revision }`. Clears events and advances the revision. Stale POST/DELETE revisions return 409. Per-account mutations are serialized in a database transaction.
- Preference summary is derived from those same events: sample size and top query, location/station/project, narrow category, explicit offer and budget frequencies. Broad default category groups and both buy/rent are not treated as explicit preferences. No separate long-lived profile survives history deletion.

LocalStorage keys start with `mapxprop_search_history_v2:` and end with `guest` or verified public user UUID. Failed uploads remain in a bounded, owner-specific queue and retry on later search, focus or reconnect. Uploads older than 30 days are dropped. A changed deletion revision discards stale queued history, so an offline device cannot restore deleted records. Auth generations and owner checks stop late responses from appearing in another account. No ad targeting is enabled.

## Personalized homepage recommendations

**Current status:** hidden at the user's request on 26 September 2026. The shared homepage no longer mounts `PropertyPreferenceSection`, so its heading, interest chips, controls and cards are absent and no recommendation candidate requests run. The component, matching helpers and tests are retained for future use. Search history, account synchronization and derived preference summaries remain active; history can still be cleared from the search field. To restore the section, import and mount `PropertyPreferenceSection` before `PropertyListingShowcase` in `src/app/(app)/(home-pages)/property-home/page.tsx`.

The following describes the retained implementation when enabled.

The subsequent requested preference feature uses this history for a compact homepage section, with up to three reusable interest/search chips and four published property cards. Each card explains its geographic distance or matching project/search choices. Mobile uses two columns; desktop uses four. Saved-listing actions retain the existing guest/account behavior.

- Derive coherent search scenarios from events in the last 90 days; preserve each scenario's location, offer, budget, category and additional filters together. Weight repeated searches with a 14-day half-life, capped at three contributions per scenario per day. Ignore broad empty browsing as evidence of a preference.
- Get candidates through the existing public property search API, scoped by page channel, offer, selected types and budget. Geographic search uses a bounding box rather than demanding that listing titles contain an area name; local Haversine filtering enforces the actual radius (2 km for stations, 3/10/25/60 km for progressively wider map zooms). Exact project identity is retained.
- Recheck types, amenities, dimensions, project ID, offer, currency, budget and price period locally. A cheap sale price cannot satisfy a rental budget. Unknown amounts do not qualify as within budget. Deduplicate candidate requests and cards; use the strongest matching scenario for each explanation. The candidate pool is bounded to 40 published records per public query, so recommendations are a selection rather than an exhaustive ranking of all inventory.
- Guests compute interests in the browser; no guest history batch is uploaded. Members derive interests from their synchronized account history. The browser issues normal public search requests for candidates. Personal results are not serialized into the server-rendered homepage or shared public cache.
- A new user sees the original homepage. No matching inventory produces a small continue-search prompt; a failed fetch produces Retry. Clearing history from the interest controls removes recommendations, and stale requests are aborted on history/account changes. Existing listing rows, ads and map-first navigation remain.

## Verification and operations

- Regression tests cover owner isolation, guest migration, exact destinations/budgets, bounded history, duplicate retries, offline queues, account changes during deletion, stale responses, cross-tab deletion and blocked storage.
- Go integration tests use only guarded PostgreSQL at `127.0.0.1:55438/mapxprop_launch_test`, with synthetic users cleaned up after testing. They exercise actual SQL retention, ownership, idempotence, clearing and deletion revision protection. Never point this fixture at production.
- Browser checks exercise real built pages with guest history and synthetic intercepted account API responses; real authenticated SQL is verified separately in the isolated database. Responsive Chrome/touch emulation is not a physical iPhone test.
- Parent-workspace evidence: `work/search-history-2026-09-26/`. Rollback may revert the web/API code while retaining the additive tables and user data; do not drop history tables as part of routine rollback.
