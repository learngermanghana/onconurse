# Onco-nurse Website

This is a Next.js website for Onco-nurse, with services, booking, events, and blog content pulled from Sedifex where configured.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sedifex blog pull integration

The public blog pages use Sedifex's public blog API first, then fall back to older integration endpoints and finally local demo posts if Sedifex does not return posts.

Configure these environment variables in `.env.local` or your hosting provider:

```bash
# Required for public blog pull. Ask Sedifex for the exact public store/blog
# slug for this store. Leave unset until Sedifex confirms the slug.
SEDIFEX_STORE_SLUG=your-sedifex-store-slug

# Optional. Leave unset for production because the code already defaults to
# https://sedifex.com. Only set this when testing against another Sedifex host.
SEDIFEX_PUBLIC_API_BASE_URL=https://sedifex.com

# Optional legacy/private integrations used by services, social settings, bookings,
# events, and as a secondary blog fallback. Get these from the Sedifex dashboard
# or integration/API settings for the store.
SEDIFEX_STORE_ID=your-store-id
SEDIFEX_INTEGRATION_API_KEY=your-integration-key
SEDIFEX_INTEGRATION_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
```

### How to get the Sedifex blog values

- `SEDIFEX_STORE_SLUG`: use the exact public store/blog slug Sedifex provides for this store. Do not guess it from the business name; if Sedifex has not confirmed a slug yet, leave it unset so the website keeps using the existing fallback blog posts.
- `SEDIFEX_PUBLIC_API_BASE_URL`: normally do not set this. The app defaults to `https://sedifex.com`, so this variable is only for staging, local Sedifex development, or a custom Sedifex host.

Blog requests follow this Sedifex contract:

- List posts: `GET /api/public/blog?storeSlug=<slug>&limit=20`
- Single post: `GET /api/public/blog/:postSlug?storeSlug=<slug>`

The site renders the list at `/blog` and each pulled post at `/blog/[slug]`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
