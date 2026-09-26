# Shared location search — 26 September 2026

Homepage hero, header, mobile search sheet and map autocomplete now share a location search service. The map remains the primary destination; the separate card catalogue explicitly retains its broad public-listing keyword search.

## Behavior

- Combine local administrative areas/neighborhoods, identified places from Longdo, the local transit directory and registered projects. Rank exact areas before partial matches, keep addresses for namesakes, and show Thai place descriptions.
- Bare area names such as บางนา resolve geographically. Explicit BTS/MRT names and station codes retain their station identity.
- A selected place carries its coordinates to the map. A registered project carries its project ID. Administrative text fallbacks retain district/province context. Category, sale/rent and budget parameters survive navigation.
- Location search does not require nearby listing text to contain the place name. The existing viewport search chooses listings geographically.
- Keep the resolved place name in the map URL and restore it on reload. Replacing a station search with a road removes the old station destination. Recent selections retain their destination metadata.
- Abort stale suggestion work, cache successful suggestion lists, validate Thailand coordinates, and preserve available local suggestions if another source fails. Provider quota and server timeouts remain enforced.
- Road geometry can produce repeated identical names at different points. Without a distinguishing address, only one road entry is shown; addressed namesakes remain separate.

## Provider detail

Longdo `/suggest` supplies suggested words. `/search` supplies named places, addresses and coordinates. Autocomplete now uses server-side `/search` through `/api/location-suggestions`; map text resolution uses `/api/location-search`. This avoids selecting an ambiguous word and geocoding it again after navigation. Reference: https://api.longdo.com/map/doc/rest.php

## Verification

Regression coverage includes common suggestion ordering, station versus district intent, namesakes, exact project identity, URL/filter preservation, invalid coordinates, failed providers, stale async work, cache/quota behavior and location text being excluded from listing keyword filters. Existing broad catalogue, map controls and touch interaction tests remain in the suite.

Local browser evidence and release details: `../../work/location-search-2026-09-26/` in the parent workspace. Chrome responsive/touch emulation covers phone, tablet and desktop; it is not a physical iPhone test. No database migration or listing/account mutation is required.

Place coverage still depends on the local directories and external map provider. A missing place produces an explanatory message and preserves the current map rather than claiming an unrelated match.
