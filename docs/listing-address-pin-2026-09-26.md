# Address-first listing location — 26 September 2026

Step 2 now starts with a single address/place search. The map appears after choosing a result, using the optional current-location action, or explicitly opening it. Numeric coordinates are under a closed disclosure. Search uses the existing shared location service; result rows show names and addresses, preserve homonyms, and carry their own place/project/station coordinates. Enter submits a search unless the user highlighted a result; the first geocoder result is never silently accepted.

The map moves beneath a fixed 38×46px pin whose ground point is the map center. Map gestures, tap-to-center, 44px zoom controls and keyboard arrows can adjust the point. Native crosshair/keyboard handling and map inertia are disabled to avoid duplicate controls and drift. A road/area starts at its broader zoom; the primary action first zooms closer when below level 17. Selecting, moving or locating a candidate clears confirmation. Only “ใช้ตำแหน่งนี้” makes the hidden latitude/longitude fields eligible for saving. Existing drafts resume their previously saved coordinates without re-geocoding their manually edited address.

Reverse lookup fills the administrative address. The compact address summary expands for optional corrections. Province remains required; street, postal code and unit are optional, and the unit input only appears for unit/space scope. A new pin updates inferred streets; a manually typed street is retained. Request cancellation prevents stale address responses, and edits made while a request is pending are preserved. Failure or timeout exposes manual correction and clears stale administrative values. GPS is requested only on the explicit “อยู่ที่ทรัพย์ตอนนี้” action, displays the device's reported uncertainty, still needs confirmation, and cannot overwrite a later selection. Invalid coordinate input does not destroy an already confirmed point.

Publish validation now rejects missing/blank coordinate strings before numeric conversion, preventing an unconfirmed point from being interpreted as zero. No schema, public route, pricing, listing gallery or consent changes.

## Verification

- 410 existing/new Node tests pass, including place identity/precision, invalid coordinates, project/station destinations, and missing-coordinate publish regression.
- Scoped ESLint and production Next build/TypeScript pass.
- Built-browser checks use an isolated synthetic account and intercept all account/draft mutations. Real Longdo SDK/tiles, responsive widths 320/390/820/1440, touch panning, confirmation invalidation, exact handoff, GPS denial/stale callbacks, reverse failure and delayed address edits are checked. No real listing is published or account modified. Responsive Chrome is not a physical iPhone test.
- Separate search smoke uses real shared location and reverse-geocoding services (Sukhumvit 39), with account state still synthetic.
- Evidence: parent workspace `work/listing-address-pin-2026-09-26/`. Existing generated `next-env.d.ts` and `tsconfig.tsbuildinfo` are preserved.

## Limits and API reference

Place lookup can return a nearby road/landmark rather than a house entrance; the user must inspect and confirm the final pin. GPS accuracy and mapping coverage are provider/device dependent. The interface does not claim survey-grade or guaranteed exact coordinates. Search remains bounded by the shared service's 120-character query limit.

Map center, location/zoom events, Crosshair visibility, keyboard and mouse inertia use the existing [Longdo Map API 2 contract](https://api.longdo.com/map/doc/ref.php). No external satellite layer or new provider is enabled.

Rollback can revert this frontend change and redeploy. Backend, stored listing coordinates and database schema are unchanged.
