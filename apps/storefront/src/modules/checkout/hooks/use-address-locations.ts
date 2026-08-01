"use client"

import { useEffect, useState } from "react"

export type StateOption = { value: string; label: string; isoCode: string }
export type CityOption = { value: string; label: string }

type StateRecord = { name: string; isoCode: string }

// Shared across every mounted form (shipping and billing render the same
// country), and kept for the life of the page so reopening a dropdown or
// switching between the two forms never refetches.
const stateCache = new Map<string, StateRecord[]>()
const cityCache = new Map<string, string[]>()
const inFlight = new Map<string, Promise<unknown>>()

async function fetchOnce<T>(key: string, url: string, pick: (json: any) => T): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const request = fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then(pick)
    .finally(() => inFlight.delete(key))

  inFlight.set(key, request)
  return request
}

/**
 * State and city options for an address form.
 *
 * The underlying dataset (`country-state-city`) is 8MB+ and lives behind
 * /api/locations rather than in the client bundle -- importing it here would put
 * every city on earth into the checkout page's JavaScript. See that route for
 * the full reasoning.
 *
 * Both lists degrade to empty rather than throwing: a failed lookup leaves the
 * dropdown empty, and the province/city fields are still submitted from the
 * form's own state, so checkout is never blocked by this request.
 */
export function useAddressLocations(countryCode?: string, provinceName?: string) {
  const country = countryCode?.toUpperCase() || ""
  const [states, setStates] = useState<StateRecord[]>(() => stateCache.get(country) ?? [])
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    if (!country) {
      setStates([])
      return
    }

    const cached = stateCache.get(country)
    if (cached) {
      setStates(cached)
      return
    }

    let active = true
    fetchOnce(`states:${country}`, `/api/locations?country=${country}`, (json) =>
      (json.states ?? []) as StateRecord[]
    )
      .then((result) => {
        stateCache.set(country, result)
        if (active) setStates(result)
      })
      .catch(() => {
        if (active) setStates([])
      })

    return () => {
      active = false
    }
  }, [country])

  // Cities are keyed by the state's ISO code, but the form stores the state's
  // display name -- resolve it through the list we already have.
  const isoCode = states.find((s) => s.name === provinceName)?.isoCode

  useEffect(() => {
    if (!country || !isoCode) {
      setCities([])
      return
    }

    const key = `${country}:${isoCode}`
    const cached = cityCache.get(key)
    if (cached) {
      setCities(cached)
      return
    }

    let active = true
    fetchOnce(`cities:${key}`, `/api/locations?country=${country}&state=${isoCode}`, (json) =>
      ((json.cities ?? []) as { name: string }[]).map((c) => c.name)
    )
      .then((result) => {
        cityCache.set(key, result)
        if (active) setCities(result)
      })
      .catch(() => {
        if (active) setCities([])
      })

    return () => {
      active = false
    }
  }, [country, isoCode])

  return {
    stateOptions: states.map((s) => ({ value: s.name, label: s.name, isoCode: s.isoCode })),
    cityOptions: cities.map((name) => ({ value: name, label: name })),
  }
}
