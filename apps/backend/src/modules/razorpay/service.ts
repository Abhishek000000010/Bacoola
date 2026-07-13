import { RazorpayProviderService } from "@sgftech/payment-razorpay/dist/services"

/**
 * Thin wrapper around the @sgftech Razorpay provider.
 *
 * The upstream plugin was built for an earlier Medusa 2.x and calls
 * `isPaymentProviderError()` from `@medusajs/framework/utils` inside
 * `buildError()`. That helper was removed in Medusa 2.17, so any error path
 * crashed with "isPaymentProviderError is not a function", masking the real
 * cause. We override `buildError()` (used via dynamic dispatch by the base
 * class) to remove that dependency and log the underlying error.
 */
export class BacoolaRazorpayService extends RazorpayProviderService {
  static identifier = "razorpay"

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
