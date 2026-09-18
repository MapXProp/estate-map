# Thailand electric-rail search catalog

Reviewed on 18 September 2026. `src/data/thailandTransitStations.json` contains 193 searchable station records across the 10 operating lines below. A shared station on two lines of the same system is stored once (Siam and Krung Thep Aphiwat); separate systems/platform locations retain separate records and codes. This is an electric urban/suburban rail catalog, not a list of conventional intercity railway stations. Planned/unopened stations are excluded using the Department of Rail Transport's operating-status field.

| Line | Station memberships |
| --- | ---: |
| BTS Sukhumvit | 47 |
| BTS Silom | 14 |
| Gold | 3 |
| MRT Blue | 38 |
| MRT Purple | 16 |
| MRT Pink, including Muang Thong Thani branch | 32 |
| MRT Yellow | 23 |
| Airport Rail Link | 8 |
| SRT Dark Red | 10 |
| SRT Light Red | 4 |

## Sources and attribution

- [Department of Rail Transport station dataset](https://data.go.th/en/dataset/rail_station), maintained 2 June 2026. [MOT resource metadata](https://datagov.mot.go.th/dataset/rail_station/resource/1f03a45d-e3b5-4e37-95e6-092dcc75f6ba) identifies the license as **Open Data Common**. The [source CSV](https://drt.gdcatalog.go.th/dataset/0462230b-f87e-4335-a870-08b3d7559f9a/resource/1f03a45d-e3b5-4e37-95e6-092dcc75f6ba/download/drt2565_02-1.csv) supplies the operating roster, codes, names and most coordinates. Pink/Yellow coordinates are absent in that file.
- [Eastern Bangkok Monorail station area maps](https://www.ebm.co.th/th/areamap/) and [Northern Bangkok Monorail station area maps](https://www.nbm.co.th/th/areamap/) use the public `https://www.ebm.co.th/mobapi-routemap/api/RouteMap/StationList?lang=th` endpoint (POST read operation). Its five-line roster supplies reviewed Thai/English names and coordinates for BTS Sukhumvit, BTS Silom, Gold, Yellow and Pink, including MT01/MT02. Only factual station data is retained, not operator map artwork.
- [SRT current station information](https://www.srtet.co.th/th/get-station) and [fare table](https://www.srtet.co.th/th/fare-information) confirm the current name **Krung Thep Aphiwat**; the DRT file still calls RN01/RW01 Bang Sue. The former name remains a search alias.
- [MRTA Pink extension](https://www.mrta.co.th/th/pink-line-extension-si-rat---muang-thong-thani) cross-checks the Muang Thong Thani branch.

The source typo `ศูนย์วัฒธรรมแห่งประเทศไทย` is corrected to `ศูนย์วัฒนธรรมแห่งประเทศไทย` (BL19), and the truncated English BL23 name is expanded to Queen Sirikit National Convention Centre. Search aliases include Aree/Ari, Rama IX/Rama 9 and the former Bang Sue Grand Station name.

## Reproducibility and behavior

Run `node scripts/sync-transit-stations.cjs` to refresh from the public sources. Review the generated diff and service status before publishing. For a saved snapshot, pass a directory containing `stations.csv` and `operator-stations.json`. The importer rejects missing coordinates, newly unreviewed line types and unexpected roster shrinkage. Tests check each station's Thai name, English name, code, unique URL identity and map destination.

Autocomplete matches the bundled catalog in the home/header/mobile omnibox and map search. Selecting a station adds a stable `station` parameter alongside its canonical name and preserves channel/offer filters. Station resolution uses catalog coordinates before external geocoding or property/project results. Same-name stations in different systems remain distinct options; an ambiguous bare name does not silently choose the first catalog row. Search suggestions continue to work if the remote property/place suggestion service is unavailable.

## Corrected featured destinations

The two home shortcuts resolve through explicit local landmark presets. Source: Longdo place-search responses retrieved 18 September 2026:

- **Soi Ari (Phahon Yothin 7):** `13.780953470242196, 100.54483583660047`. Verified response name `ซอยพหลโยธิน 7 (ซอยอารีย์)`, Sam Sen Nai, Phaya Thai, Bangkok. A bare provider search for `ซอยอารีย์` incorrectly returned a different province, so that provider result is no longer used for this destination.
- **Rama 9–Ratchadaphisek intersection:** `13.7560737133026, 100.565071105957`. Verified response name `แยกพระราม 9`, Din Daeng, Bangkok. This point is deliberately distinct from the MRT Phra Ram 9 station coordinates.

The business placeholder now asks for a location, building or transit station, without promising compound property-type/location parsing.
