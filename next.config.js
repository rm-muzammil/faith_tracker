/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "quran-api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 30 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: { cacheName: "static-cache", expiration: { maxEntries: 200 } },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  experimental: { instrumentationHook: true },
  async headers() {
    return [
      {
        // Never cache HTML pages — always fetch fresh from server
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);