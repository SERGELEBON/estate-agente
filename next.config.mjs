// Canonical production domain. On Vercel, NextAuth builds the OAuth redirect_uri from the
// host the visitor used, so opening a deployment URL (state-agente-xxxx-….vercel.app) would
// send an unregistered redirect_uri to Google/Facebook ("redirect_uri_mismatch", "URL Blocked").
// In production every other host is redirected to the canonical one.
const CANONICAL_URL = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
const CANONICAL_HOST = CANONICAL_URL ? new URL(CANONICAL_URL).host : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    if (process.env.VERCEL_ENV !== "production" || !CANONICAL_HOST) return [];
    return [
      {
        source: "/:path*",
        missing: [{ type: "host", value: CANONICAL_HOST }],
        destination: `${CANONICAL_URL}/:path*`,
        permanent: false,
      },
    ];
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.imgur.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Hero photos from Wikimedia Commons (CC licences, credited on each slide)
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
