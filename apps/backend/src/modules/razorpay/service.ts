import { RazorpayProviderService } from "@sgftech/payment-razorpay/dist/services"

/**
 * Thin wrapper around the @sgftech Razorpay provider.
 *
 * The upstream plugin was built for an earlier Medusa 2.x and has two
 * incompatibilities with Medusa 2.17 that we patch here:
 *
 * 1. `buildError()` calls `isPaymentProviderError()` from
 *    `@medusajs/framework/utils`, which was removed in 2.17 — any error path
 *    crashed with "isPaymentProviderError is not a function", masking the real
 *    cause. We override `buildError()` to drop that dependency and log.
 *
 * 2. In 2.17 every provider method receives a single `{ data, context }`
 *    object and must return `{ data, status? }`. The plugin migrated
 *    `initiatePayment`/`updatePayment` but NOT `authorizePayment`,
 *    `getPaymentStatus`, `capturePayment`, or `retrievePayment`: those still
 *    read the Razorpay order id off the top-level argument (`arg.id`) instead
 *    of `arg.data.id`. The result was `orders.fetch(undefined)` →
 *    "`order_id` is mandatory", so a paid cart could never authorize and no
 *    order was ever created (and therefore nothing reached Shiprocket). We
 *    override those four methods to unwrap `data` and normalize the output.
 *
 * 3. `initiatePayment` converts the amount for INR as
 *    `getAmountFromSmallestUnit(amount) * 100 * 100`, which is lossy in binary
 *    floating point: a ₹6907 cart becomes 690699.9999999999 and Razorpay
 *    rejects it with "The amount must be an integer." Whether a cart fails
 *    depends on its total (₹2598 → 259800 is exact and works), so checkout
 *    broke only for some baskets. The plugin swallows the failure by
 *    *returning* buildError() instead of throwing, so Medusa stores a session
 *    with no order id and the storefront's Place order button stays disabled.
 *    We round the amount at the Razorpay client boundary.
 */
export class BacoolaRazorpayService extends RazorpayProviderService {
  static identifier = "razorpay"

  init() {
    // @ts-ignore - base class builds the Razorpay client here
    super.init()
    this.roundOrderAmounts()
  }

  /**
   * Razorpay requires an integer amount in the smallest currency unit. The
   * upstream amount maths can land a hair off an integer, so round it on the
   * way out rather than reimplementing initiatePayment.
   */
  private roundOrderAmounts() {
    // @ts-ignore - base class exposes the Razorpay client
    const client: any = this.razorpay_
    if (!client?.orders?.create || client.orders.__amountRoundingPatched) {
      return
    }

    const create = client.orders.create.bind(client.orders)
    client.orders.create = (params: any, ...rest: any[]) => {
      const amount = Number(params?.amount)
      if (Number.isFinite(amount) && !Number.isInteger(amount)) {
        params = { ...params, amount: Math.round(amount) }
      }
      return create(params, ...rest)
    }
    client.orders.__amountRoundingPatched = true
  }

  // Medusa 2.17 wraps the session data as `{ data, context }`; older plugin
  // methods expect the raw Razorpay order object. Unwrap defensively.
  private unwrap(input: any): Record<string, unknown> {
    return (input && typeof input === "object" && "data" in input
      ? (input.data ?? {})
      : input) as Record<string, unknown>
  }

  async getPaymentStatus(input: any) {
    const data = this.unwrap(input)
    // Base method returns a raw PaymentSessionStatus string.
    const status = await super.getPaymentStatus(data as any)
    return { status, data } as any
  }

  async authorizePayment(input: any) {
    const data = this.unwrap(input)
    const status = await super.getPaymentStatus(data as any)
    return { data, status } as any
  }

  async capturePayment(input: any) {
    const data = this.unwrap(input)
    const result = await super.capturePayment(data as any)
    return { data: (result as any) ?? data } as any
  }

  async retrievePayment(input: any) {
    const data = this.unwrap(input)
    const result = await super.retrievePayment(data as any)
    return { data: (result as any) ?? data } as any
  }

  buildError(message: string, e: any) {
    // Surface the real underlying error in the logs.
    try {
      const detail =
        e?.error?.description ??
        e?.description ??
        e?.message ??
        (typeof e === "object" ? JSON.stringify(e) : String(e))
      // @ts-ignore - base class exposes a logger
      this.logger?.error(`[razorpay] ${message} :: ${detail}`)
    } catch {
      // ignore logging failures
    }

    const isProviderError = !!(
      e &&
      typeof e === "object" &&
      "error" in e &&
      "code" in e &&
      "detail" in e
    )

    return {
      error: message,
      code: e && typeof e === "object" && "code" in e ? e.code : "",
      detail: isProviderError
        ? `${e.error}\n${e.detail ?? ""}`
        : e && typeof e === "object" && "detail" in e
        ? e.detail
        : e?.message ?? "",
    }
  }
}
