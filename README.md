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

# Required for Sedifex service pulls, bookings, and hosted checkout.
SEDIFEX_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
SEDIFEX_INTEGRATION_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
SEDIFEX_BOOKING_TARGET_STORE_ID=your-booking-store-id
SEDIFEX_BOOKING_API_KEY=your-store-authorized-booking-key
SEDIFEX_CHECKOUT_API_KEY=your-store-authorized-checkout-key
SEDIFEX_INTEGRATION_CHECKOUT_CREATE_URL=https://us-central1-sedifex-web.cloudfunctions.net/integrationCheckoutCreate
SEDIFEX_CHECKOUT_RETURN_URL=http://localhost:3000/payment/return
SEDIFEX_CONTRACT_VERSION=2026-04-13

# Optional aliases supported by the website.
SEDIFEX_STORE_ID=your-store-id
SEDIFEX_INTEGRATION_API_KEY=your-store-or-master-integration-key
SEDIFEX_PRODUCTS_API_KEY=your-products-api-key
SEDIFEX_INTEGRATION_KEY=your-integration-key
NEXT_PUBLIC_SEDIFEX_STORE_ID=your-public-store-id
```

## Sedifex service pull integration

Services are pulled by `getSedifexServices()` / `getServiceData()` in
`lib/sedifex.ts`. Service detail pages call `getSedifexService()` first so
`/services/[slug]` can refresh from Sedifex item endpoints before falling back
to the list response. The website service list first calls:

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

Service detail pages try these Sedifex item endpoints with `slug` and `itemId`
lookups before falling back to the service list:

```text
GET /v1IntegrationItem?storeId=<store id>&slug=<slug>
GET /v1IntegrationItems?storeId=<store id>&slug=<slug>
GET /v1IntegrationProduct?storeId=<store id>&slug=<slug>
GET /publicQuickPayItem?storeId=<store id>&slug=<slug>
```

## Sedifex availability / upcoming events integration

The `/events` page is labelled Upcoming Events and pulls from Sedifex
availability endpoints first, including public availability fallbacks when
available. The site checks availability-shaped payload keys
such as `availability`, `availabilities`, `availableSlots`, `slots`,
`appointments`, and `bookableSlots`, then falls back to older event endpoints
and finally local demo events if nothing is configured.


## Sedifex booking and checkout integration

The booking form creates the Sedifex booking first with `POST /v1IntegrationBookings?storeId=<store id>`. It marks the booking for online checkout (`paymentCollectionMode=online_checkout`, `paymentStatus=checkout_created`) and keeps website context in `attributes`. After Sedifex returns a booking id, the API route creates hosted checkout with `POST /integrationCheckoutCreate` using the same store id and a `clientOrderId` of `BOOKING-<bookingId>`.

The browser is redirected only to the checkout URL Sedifex returns (`authorizationUrl` or `checkoutUrl`). The `/payment/return` page deliberately shows a verification message instead of marking payment paid; final confirmation must come from Sedifex payment webhook/order verification. Keep all Sedifex keys server-side and do not expose them with `NEXT_PUBLIC_`.

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
