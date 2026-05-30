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
# Required for public blog pull. Defaults to onco-nurse if omitted.
SEDIFEX_STORE_SLUG=onco-nurse

# Optional. Defaults to https://sedifex.com for /api/public/blog.
SEDIFEX_PUBLIC_API_BASE_URL=https://sedifex.com

# Optional legacy/private integrations used by services, social settings, bookings,
# events, and as a secondary blog fallback.
SEDIFEX_STORE_ID=your-store-id
SEDIFEX_INTEGRATION_API_KEY=your-integration-key
SEDIFEX_INTEGRATION_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
```

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
