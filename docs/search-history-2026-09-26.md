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

LocalStorage keys start with `mapxprop_search_history_v2:` and end with `guest` or verified public user UUID. Failed uploads remain in a bounded, owner-specific queue and retry on later search, focus or reconnect. Uploads older than 30 days are dropped. A changed deletion revision discards stale queued history, so an offline device cannot restore deleted records. Auth generations and owner checks stop late responses from appearing in another account. No recommendation ranking or ad targeting is enabled by this change.

## Verification and operations

- Regression tests cover owner isolation, guest migration, exact destinations/budgets, bounded history, duplicate retries, offline queues, account changes during deletion, stale responses, cross-tab deletion and blocked storage.
- Go integration tests use only guarded PostgreSQL at `127.0.0.1:55438/mapxprop_launch_test`, with synthetic users cleaned up after testing. They exercise actual SQL retention, ownership, idempotence, clearing and deletion revision protection. Never point this fixture at production.
- Browser checks exercise real built pages with guest history and synthetic intercepted account API responses; real authenticated SQL is verified separately in the isolated database. Responsive Chrome/touch emulation is not a physical iPhone test.
- Parent-workspace evidence: `work/search-history-2026-09-26/`. Rollback may revert the web/API code while retaining the additive tables and user data; do not drop history tables as part of routine rollback.
