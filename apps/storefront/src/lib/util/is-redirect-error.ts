/**
 * True when an error is Next.js's internal redirect signal.
 *
 * `redirect()` (used by server actions like `placeOrder`) doesn't return -- it
 * throws an exception whose `digest` starts with "NEXT_REDIRECT" so the
 * framework can navigate. When that call is wrapped in a try/catch, the signal
 * gets mistaken for a real failure. Use this to spot it and re-throw, letting
 * the navigation happen instead of surfacing "NEXT_REDIRECT" to the user.
 */
export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  )
}
