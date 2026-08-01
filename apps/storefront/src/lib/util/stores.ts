/**
 * Physical store list for the STORE AVAILABILITY panel.
 *
 * Hardcoded rather than modelled in Medusa: these are shop addresses, not stock
 * locations, and the panel only shows where the shops are -- it makes no claim
 * about what is in them. Wiring real per-store availability means creating a
 * Medusa stock location per shop and splitting inventory across them; until
 * that exists, promising "in stock here" would be a lie.
 *
 * Coordinates are plain decimal lat/lng. The easiest way to get them: open the
 * address on openstreetmap.org, right-click the spot, "Show address" -- the URL
 * then contains mlat/mlon.
 */

export type Store = {
  id: string
  name: string
  address: string[]
  city: string
  /** Decimal degrees. */
  lat: number
  lng: number
  hours?: string
  phone?: string
}

export const STORES: Store[] = [
  {
    id: "thane",
    name: "Bacoola Thane",
    address: [
      "Office No. 721, Centura Square IT Park",
      "Rd Number 27, Wagle Industrial Estate",
      "Thane West",
    ],
    city: "Thane, Maharashtra 400604",
    // Geocoded to Wagle Industrial Estate, not the building itself -- the IT
    // park isn't in OpenStreetMap's index, so the pin lands in the right
    // locality but not on the door. Replace with exact coordinates when known.
    lat: 19.1985175,
    lng: 72.9509778,
    hours: "Mon-Sat, 10:00 - 19:00",
  },
]

/** Map viewport padding, in degrees, around a pinned store. */
const BBOX_PAD = 0.012

/**
 * OpenStreetMap embed URL for one store.
 *
 * Deliberately not Google Maps: this needs no API key and no billing account,
 * which matters for a site that isn't live yet.
 */
export const storeMapUrl = (store: Store): string => {
  const bbox = [
    store.lng - BBOX_PAD,
    store.lat - BBOX_PAD,
    store.lng + BBOX_PAD,
    store.lat + BBOX_PAD,
  ].join(",")
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${store.lat},${store.lng}`
}

/** Link out to a full map, for directions. */
export const storeDirectionsUrl = (store: Store): string =>
  `https://www.openstreetmap.org/?mlat=${store.lat}&mlon=${store.lng}#map=17/${store.lat}/${store.lng}`

/** Free-text match over name, address and city. */
export const searchStores = (query: string): Store[] => {
  const q = query.trim().toLowerCase()
  if (!q) return STORES
  return STORES.filter((s) =>
    [s.name, s.city, ...s.address].join(" ").toLowerCase().includes(q)
  )
}
