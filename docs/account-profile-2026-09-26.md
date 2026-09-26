# Account photos and reusable listing contact details

The account page now offers a photo preview/save/remove control and an optional, collapsed listing contact form. Contact name, phone, LINE, contact email and publisher role reuse the existing account-scoped `/me/listing-contact` API. Secondary phone and Instagram remain under an additional-options disclosure. Company and authority fields follow the selected role. Loading failures offer retry; failed saves preserve edits.

Account identity and listing contact identity remain separate. Saving contact defaults does not update existing listings. Step 3 now uses the saved contact name/email instead of the account identity, while preserving explicit draft values (including a blank email) and edits made while defaults load.

Photo uploads preview the square crop, prepare a 512px JPEG and use authenticated PUT/DELETE `/me/avatar`. API migration `0177_account_avatar.sql` adds an optional `auth_users.avatar_url`. The API bounds and decodes uploads, rejects unsupported bytes, and re-encodes photos without EXIF. Only server-generated file paths are stored. Public listing contact cards display the account photo only when the listing's name and phone match that account's contact defaults. Organization verification and account permissions are unaffected.

The auth hook now starts with the same empty account state during server/client rendering and restores the verified account in its existing effect. This fixes signed-in reload hydration errors without remounting forms during a profile update.

Validation: Next production build/TypeScript, scoped ESLint, 411 frontend tests; 12 targeted checks after the final auth/default changes; Go suite; isolated PostgreSQL upload/read/refresh/removal, account isolation, contact persistence and unchanged listing-contact checks. 23 browser interaction checks cover reload, save/load errors, conditional role fields, photo cancellation/upload/removal, draft precedence, delayed defaults, account switching and widths 320/390/820/1440. Browser QA uses intercepted synthetic accounts and no real production writes. This is Chrome viewport/touch simulation, not physical-device testing.

Evidence: `../work/account-profile-2026-09-26/`. No public route or sitemap change is needed for this private account page.
