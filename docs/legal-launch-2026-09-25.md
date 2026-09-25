# Public policies and retirement of payment demos — 25 September 2026

Scope: launch-audit items 1 and 2 only. No account data, listings or billing records were modified.

## Public pages

- `/privacy`: data categories, service/security/consent purposes, public listing data, recipients, retention criteria, rights and contact instructions.
- `/terms`: platform role, authorized listings, content rights, prohibited use, moderation, current free service, legal rights preserved.
- `/cookies`: essential authentication/preferences/storage, optional analytics, retention, external services, change/withdraw choices.
- `/listing-plans`: current free listing service, no credit card or automatic paid enrollment; real create/manage listing links.

All four have unique metadata, index/follow, canonical URLs and sitemap entries dated on publication. Aliases `/privacy-policy` and `/terms-of-service` permanently redirect. `/subscription`, `/checkout` and `/pay-done` permanently redirect to `/listing-plans`; the template checkout components and forms were removed. Redirect aliases stay out of the sitemap.

The shared property footer links to policies, cookie settings and free-listing information. Signup shows terms/privacy links for both providers and email. This is a notice; it does not add backend acceptance records or represent optional analytics as a prerequisite for registration. Mobile public-information routes use property search and omit the legacy travel bottom navigation.

## Operator details

The existing public contact page supplied `mapxprop@gmail.com`, `094-517-4626`, and 8 อาคารสมกิจ ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900. No legal company/person name was verified, so the text identifies “ผู้ดำเนินการเว็บไซต์ MapxProp”. The owner was asked for their exact legal operator name; replace this description when supplied. Do not invent a company registration, DPO appointment, data-transfer contract or retention period.

The policy is an explanation of observed functionality and commitments, not a certification of legal compliance. Account deletion/rights requests use the existing contact channels; there is no new automatic deletion workflow. Actual ongoing request handling and provider arrangements remain the operator's responsibility.

## Cookie behavior

- Basic opt-in: no Google tag, GA queue or custom analytics before a valid explicit analytics choice. Necessary features do not depend on that choice.
- A versioned localStorage record expires after 180 days. Invalid/expired/missing data fails closed. Blocked storage can retain an explicit choice in memory for the current document.
- Both contact and listing-funnel entry points check consent, including after initialization. Pre-consent events are dropped, not replayed.
- Withdrawal sets Google's `ga-disable-ID` flag, updates analytics consent, removes contact listeners and accessible first-party analytics cookies, and removes the analytics dedup session record. Drafts, authentication and saved listings are untouched. Already processed data is not automatically erased.
- Choices synchronize between tabs. A loaded Google script cannot be unloaded from browser memory; its collection is disabled. New documents with a denied choice do not load it.
- Google advertising storage/user-data/personalization are denied; Google signals and ad personalization are disabled. Analytics cookie expiry is explicitly 180 days. Initial config omits query/hash; existing GA enhanced history measurement is unchanged.

## Validation

- Full frontend Node suite: 372 passing tests. After adding mobile-route recognition, focused organization-navigation/map-contact suite also passed.
- Scoped ESLint and production build.
- HTTP checks: four pages 200 with one H1/indexable canonical; demo and alias routes 308; sitemap 174 unique URLs, including all four new pages and excluding redirects.
- Headless Chrome at 390, 820 and 1440 pixels, light/dark; signup links, footer links, default rejection, rejection after reload, explicit grant, withdrawal, cookie cleanup, regrant, cross-tab withdrawal. Analytics collection requests were intercepted and fulfilled locally to avoid sending synthetic visits/conversions to GA.
- Browser evidence and release logs: `../work/legal-launch-2026-09-25/` from the workspace root. Responsive emulation is not a claim of physical-device testing.

## References used

- Personal Data Protection Act and related notices, official-government copy: https://www.epad.go.th/fileupload/3589927270.pdf
- Google basic vs advanced consent: https://developers.google.com/tag-platform/security/concepts/consent-mode
- Google consent implementation: https://developers.google.com/tag-platform/security/guides/consent
- Google disable flag and advertising controls: https://developers.google.com/tag-platform/security/guides/privacy

Policy copy was written for the implementation; the references are not claims of external approval.
