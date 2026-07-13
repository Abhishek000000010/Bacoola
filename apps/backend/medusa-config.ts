import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
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
  ],
  plugins: [
    {
      resolve: "@sam-ael/medusa-plugin-shiprocket",
      options: {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
        channel_id: process.env.SHIPROCKET_CHANNEL_ID,
        pricing: "flat_rate",
        length_unit: "cm",
      },
    },
  ],
})
