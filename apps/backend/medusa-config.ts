import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Redis (Upstash) backs the cache, event bus, workflow engine and distributed
// locks. Without it Medusa silently falls back to in-memory implementations —
// a "fake redis" cache, a local event bus that drops queued jobs on restart,
// and in-process locking that cannot protect against double-spend across
// requests or instances (see docs/WEBSITE-ANALYSIS.md section A1).
//
// The modules are only registered when REDIS_URL is set, so a checkout without
// Redis credentials still boots (with the in-memory fallbacks + Medusa's usual
// warnings). Upstash URLs are TLS: rediss://default:<token>@<host>:6379
const REDIS_URL = process.env.REDIS_URL

const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/cache-redis",
        options: {
          redisUrl: REDIS_URL,
          // Namespaced so multiple environments can share one Upstash DB
          // without colliding. TTL is in seconds.
          namespace: process.env.REDIS_NAMESPACE || "bacoola-cache",
          ttl: 30,
        },
      },
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: {
          redisUrl: REDIS_URL,
          queueName: process.env.REDIS_NAMESPACE
            ? `${process.env.REDIS_NAMESPACE}-events`
            : "bacoola-events",
        },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: {
          // NOTE: 2.17.2 logs a deprecation warning asking for `redisUrl` /
          // `redisOptions` here, but its loader still destructures
          // `options.redis.url` — switching to the "new" names crashes the
          // Workflows module at boot. Keep this shape until a later Medusa
          // version actually supports the rename. The warning is harmless.
          redis: {
            url: REDIS_URL,
            // BullMQ requires blocking commands with retries disabled;
            // ioredis' default of 20 retries makes workers throw on Upstash.
            options: { maxRetriesPerRequest: null },
          },
        },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Separate from the Redis *modules* below: this one backs the express
    // session store. Without it Medusa logs "redisUrl not found. A fake redis
    // instance will be used." and keeps sessions in process memory, so logins
    // drop on every restart/redeploy and don't survive more than one instance.
    redisUrl: REDIS_URL,
    redisPrefix: process.env.REDIS_NAMESPACE
      ? `${process.env.REDIS_NAMESPACE}:sess:`
      : "bacoola:sess:",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      // @ts-ignore - Disable secure cookies when testing production build locally via HTTP
      cookieSecure: process.env.NODE_ENV === "production" && !process.env.ADMIN_CORS?.includes("localhost"),
    }
  },
  modules: [
    ...redisModules,
    {
      // File storage: Cloudinary instead of local disk.
      // Credentials are read from env vars (see .env.template) — never hardcoded.
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "./src/modules/cloudinary",
            id: "cloudinary",
            options: {
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET,
              secure: true,
              folder: process.env.CLOUDINARY_FOLDER || "bacoola",
            },
          },
        ],
      },
    },
    {
      // Fulfillment: register Shiprocket as a fulfillment PROVIDER so that
      // creating a fulfillment for an order pushes it to the Shiprocket
      // dashboard (assigns an AWB, schedules pickup). Registering the plugin in
      // the `plugins` array below only loads the admin widget + API routes — it
      // does NOT make Shiprocket available as a provider. Both are required.
      // The manual provider is kept so manual/return fulfillments still work.
      // Credentials come from env vars — never hardcoded.
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "@sam-ael/medusa-plugin-shiprocket",
            id: "shiprocket",
            options: {
              email: process.env.SHIPROCKET_EMAIL || "dummy@example.com",
              password: process.env.SHIPROCKET_PASSWORD || "dummypassword",
              // Must match a pickup location nickname configured in your
              // Shiprocket dashboard (Settings → Pickup Addresses). Defaults to
              // "Primary" inside the plugin if unset.
              pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
            },
          },
        ],
      },
    },
    {
      // Payments: Razorpay (works in India, unlike Stripe). The default manual
      // provider (pp_system_default) stays available automatically.
      // Credentials come from env vars — never hardcoded.
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            // Wrapper around @sgftech/payment-razorpay that fixes a Medusa 2.17
            // incompatibility (see src/modules/razorpay/service.ts).
            resolve: "./src/modules/razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
              razorpay_account: process.env.RAZORPAY_ACCOUNT,
              auto_capture: true,
              refund_speed: "normal",
              automatic_expiry_period: 30,
              manual_expiry_period: 20,
              webhook_secret:
                process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_webhook_secret",
            },
          },
        ],
      },
    },
    {
      // Landing Pages CMS — custom standalone module for managing
      // marketing/landing page content (hero banners, editorial sections, etc.)
      // directly from the Medusa admin. Completely independent of commerce modules.
      resolve: "./src/modules/landing-pages",
    },
  ],
  plugins: [
    {
      resolve: "@sam-ael/medusa-plugin-shiprocket",
      options: {
        email: process.env.SHIPROCKET_EMAIL || "dummy@example.com",
        password: process.env.SHIPROCKET_PASSWORD || "dummypassword",
        channel_id: process.env.SHIPROCKET_CHANNEL_ID || "12345",
        pricing: "flat_rate",
        length_unit: "cm",
      },
    },
  ],
})
