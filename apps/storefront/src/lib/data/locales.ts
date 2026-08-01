"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}

// `/store/locales` is optional -- a backend without the route 404s, and this
// module is expected to return null for that. But Next's Data Cache only stores
// successful responses, so `cache: "force-cache"` does nothing for a 404: the
// nav renders on every page, so every single page view re-requested a route we
// already knew was missing (~75ms each).
//
// Remember the outcome in-process instead, successes included. The TTL matches
// the 300s used for other rarely-changing store data, so adding the route to the
// backend still gets picked up without a restart.
const LOCALES_TTL_MS = 300_000

let localesCache: { value: Locale[] | null; expires: number } | undefined
// Shared so concurrent renders await one request rather than starting a stampede.
let localesInFlight: Promise<Locale[] | null> | undefined

/**
 * Fetches available locales from the backend.
 * Returns null if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  if (localesCache && localesCache.expires > Date.now()) {
    return localesCache.value
  }

  if (localesInFlight) {
    return localesInFlight
  }

  localesInFlight = (async () => {
    const next = {
      ...(await getCacheOptions("locales")),
    }

    return sdk.client
      .fetch<{ locales: Locale[] }>(`/store/locales`, {
        method: "GET",
        next,
        cache: "force-cache",
      })
      .then(({ locales }: any) => locales as Locale[] | null)
      .catch(() => null)
  })()

  try {
    const value = await localesInFlight
    localesCache = { value, expires: Date.now() + LOCALES_TTL_MS }
    return value
  } finally {
    localesInFlight = undefined
  }
}
