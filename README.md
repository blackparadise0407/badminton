This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## PWA and offline behavior

The app can be installed from a supported mobile browser. Its service worker
caches static assets and signed-in pages that have been visited; do not use
offline caching on a shared or unlocked device because those pages can contain
session and payment information. Use **Offline data on this device** in the app
to clear saved pages.
Client API reads also use a bounded, 30-second in-memory cache for faster
in-app navigation. Successful mutations and retries invalidate cached reads;
the server remains authoritative, and authenticated API responses are not
cached by Next.js.
The interface supports English and Vietnamese. Use the language selector to
change the language; the selection is saved on the current device.
Session summary images now open in an in-app preview with a return link, plus
native sharing and download controls where supported.

Next.js retries interrupted navigations and Server Actions after connectivity
returns while the app remains open. This is not a durable background mutation
queue: pending changes are not guaranteed to survive closing the tab or app.
The pages and forms still depend on the server for data and writes.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
