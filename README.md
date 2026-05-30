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

# Required for Sedifex service pulls and bookings.
SEDIFEX_STORE_ID=your-store-id
SEDIFEX_INTEGRATION_API_KEY=your-store-or-master-integration-key
SEDIFEX_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net

# Optional aliases supported by the website.
SEDIFEX_INTEGRATION_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
SEDIFEX_PRODUCTS_API_KEY=your-products-api-key
SEDIFEX_BOOKING_API_KEY=your-booking-api-key
SEDIFEX_INTEGRATION_KEY=your-integration-key
SEDIFEX_BOOKING_TARGET_STORE_ID=your-booking-store-id
NEXT_PUBLIC_SEDIFEX_STORE_ID=your-public-store-id
```

## Sedifex service pull integration

Services are pulled by `getSedifexServices()` / `getServiceData()` in
`lib/sedifex.ts`. The website first calls:

```text
GET /v1IntegrationProducts?storeId=<store id>
```

The authenticated request sends the integration API key in both `x-api-key` and
`Authorization: Bearer <key>`, includes `X-Sedifex-Contract-Version: 2026-04-13`,
and uses a 30-second Next.js revalidation window. The response can contain
`publicServices`, `products`, or `publicProducts`; the site prefers
`publicServices`, otherwise it filters product records where `itemType` or `type`
lowercases to `service`.

If the authenticated products endpoint returns no services, the site falls back to:

```text
GET /publicQuickPayCatalog?storeId=<store id>
```

That public fallback only sends `Accept: application/json`, also revalidates every
30 seconds, and filters the returned `items` array to service records. Sedifex
service records are normalized into the local service-card shape, including
cleaning metadata-like description lines, removing `not provided` categories,
using `imageUrl` or the first `imageUrls` item, and preserving Sedifex ordering
with preferred Onco-nurse service names first. If Sedifex is not configured,
returns no matching services, or errors, local fallback services are rendered.

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
