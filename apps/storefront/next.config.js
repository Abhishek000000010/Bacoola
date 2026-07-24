const path = require("path")
const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * The backend pulls in React 18 (Medusa's admin dashboard needs it) and npm
 * hoists it to the workspace root, while the storefront keeps React 19 nested
 * in its own node_modules. Storefront UI dependencies (@headlessui/react,
 * @medusajs/ui, react-select, ...) get hoisted to the root too, so they resolve
 * React from the root and hand back elements created by a different React than
 * the one rendering them. The mismatched $$typeof symbol makes React reject
 * valid elements as plain objects -- "Minified React error #31" during
 * prerender. Pinning React to the storefront's copy keeps both apps on the
 * version they expect.
 */
const reactAliases = {
  react: path.dirname(require.resolve("react/package.json")),
  "react-dom": path.dirname(require.resolve("react-dom/package.json")),
}

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Applies to `next build` / webpack.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...reactAliases,
    }
    return config
  },
  // Applies to `next dev --turbopack`, which does not read the webpack config.
  turbopack: {
    resolveAlias: reactAliases,
  },
  experimental: {
    serverMinification: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
// Triggering Next.js restart
