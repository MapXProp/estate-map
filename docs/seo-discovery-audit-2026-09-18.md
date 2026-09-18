# SEO review of recent public pages — 18 September 2026

## Baseline

Audited the live homes, rooms, business, buy, rent, transit directory, organization directory/profile, property catalog, map and listing detail pages. Also crawled all 160 URLs in the existing XML sitemap.

All 160 sitemap URLs returned HTTP 200, had one H1, a description, an indexable robots directive and a self-referencing canonical. Titles were unique. Published listing detail pages already included property/offer data and breadcrumbs. Public content and listing links were present in server-rendered HTML.

The sitemap and robots.txt already existed. This release improves them; it does not replace an absent sitemap.

## Changes and editorial decisions

- Preserve the existing, descriptive homes and buy metadata. Centralize channel metadata in `src/lib/discoveryPageSeo.ts` so canonical URLs, social metadata and sitemap entries agree.
- Refine rooms/business descriptions and use the corresponding existing hero photo for social previews.
- Keep the `/rent` entry usable, but canonicalize it to `/rooms`: both show the monthly-rental inventory. Remove the unsupported promise of whole-house rentals from that entry's metadata. Exclude the duplicate from the sitemap and point the footer rental shortcut at `/rooms`.
- Describe the transit directory's actual scope: operating electric rail in Bangkok and surrounding provinces. Read line/station counts from the existing JSON catalogue. Use a clear H1 and line-selection heading.
- Add CollectionPage structured data for the channel landing pages, transit directory and organization directory. Transit line and organization ItemLists describe exactly the entries rendered on those directories. Do not invent listing counts, review scores or station-specific landing pages.
- Add breadcrumb structured data to the transit directory and organization profiles, matching the navigation visible on the page. Use canonical `/homes` links in those breadcrumbs.
- Encode organization identifiers consistently in directory links, sitemap URLs and structured data, including the public-ID fallback for organizations without a slug.
- Add recorded content-revision dates for the changed landing/directory pages. Keep actual listing modification dates and photos. Leave modification dates absent when unknown.

## Sitemap and crawling policy

- Public XML: `https://mapxprop.com/sitemap.xml`.
- Discovery reference: `https://mapxprop.com/robots.txt` already declares that sitemap.
- Revalidation: 300 seconds. Listings and organizations come from the public API, including pagination. Upstream failures throw instead of replacing a good sitemap with an empty one.
- Include canonical channel pages, directories, published listings, organization profiles and sufficiently populated catalog pages.
- Keep search/filter/map-query combinations and private/account URLs out of the sitemap. Filtered map pages remain noindex/follow; the base map is indexable.
- `/rent` is a supported non-canonical entry. It must not be re-added to the sitemap while its content duplicates `/rooms`.
- Update `discoveryPageContentUpdatedAt` only after meaningful content, link or structured-data changes, not on each deployment.
- The current sitemap is well below Google's 50,000-URL / 50 MB limits. Partition before exceeding them. The public catalog reader already fails explicitly rather than silently truncating a large inventory.

## Validation and limits

SEO regression tests cover metadata/canonical/sitemap consistency, available preview images, transit coverage and line anchors, public organization links, JSON-LD collection contents, API pagination/failures and existing listing markup. Release build and full live-crawl results are retained in the workspace under `work/seo-audit-2026-09-18/`.

This is a source-code and live-HTTP SEO audit. It does not claim a Search Console submission, Google indexing status, ranking improvements, a Rich Results Test result or a rendered mobile performance score.

## References

- [Google: descriptive titles and main headings](https://developers.google.com/search/docs/appearance/title-link)
- [Google: crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: sitemap generation, canonical URLs, accurate lastmod and discovery](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
