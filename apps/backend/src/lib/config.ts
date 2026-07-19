import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: "http://localhost:9000",
  auth: {
    type: "session",
  },
})
