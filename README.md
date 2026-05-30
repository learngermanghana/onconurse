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
# Public blog pull. These defaults already point to the Onco-nurse Sedifex
# blog feed: https://www.sedifex.com/api/public-blog?storeId=YvRddOFEYlhYoNrwqSyHwShPioR2
# Override only if Sedifex gives you a different public blog URL or store ID.
SEDIFEX_PUBLIC_BLOG_URL=https://www.sedifex.com/api/public-blog
SEDIFEX_PUBLIC_BLOG_STORE_ID=YvRddOFEYlhYoNrwqSyHwShPioR2

# Optional legacy/private integrations used by services, social settings, bookings,
# events, and as a secondary blog fallback. Get these from the Sedifex dashboard
# or integration/API settings for the store.
SEDIFEX_STORE_ID=your-store-id
SEDIFEX_INTEGRATION_API_KEY=your-integration-key
SEDIFEX_INTEGRATION_API_BASE_URL=https://us-central1-sedifex-web.cloudfunctions.net
```

### Sedifex public blog values

- `SEDIFEX_PUBLIC_BLOG_URL`: the Sedifex public blog endpoint. For this site it is `https://www.sedifex.com/api/public-blog`.
- `SEDIFEX_PUBLIC_BLOG_STORE_ID`: the `storeId` query value from the Sedifex URL. For this site it is `YvRddOFEYlhYoNrwqSyHwShPioR2`.
- Full feed URL: `https://www.sedifex.com/api/public-blog?storeId=YvRddOFEYlhYoNrwqSyHwShPioR2`.

Blog requests follow this Sedifex contract:

- List posts: `GET /api/public-blog?storeId=<storeId>`
- Single post: the site loads the public feed and matches the requested post slug locally.

The site renders the list at `/blog` and each pulled post at `/blog/[slug]`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
