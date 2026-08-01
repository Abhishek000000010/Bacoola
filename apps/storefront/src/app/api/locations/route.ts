import { City, State } from "country-state-city"
import { NextRequest, NextResponse } from "next/server"

/**
 * State / city lookup for the checkout address forms.
 *
 * `country-state-city` carries a 7.7MB `city.json` (every city on earth) plus a
 * 0.5MB `state.json`. The checkout forms used to import it directly, which is a
 * client component, so the whole dataset was bundled and shipped to the browser:
 * the checkout route served 9.3MB of JavaScript against ~700KB for every other
 * page, all to populate two dropdowns.
 *
 * Keeping the lookup in a route handler leaves the dataset on the server and
 * sends only the handful of names actually being displayed. The data is static
 * for the lifetime of a deployment, so it is cached hard.
 *
 * GET /api/locations?country=IN          -> { states: [{ name, isoCode }] }
 * GET /api/locations?country=IN&state=MH -> { cities: [{ name }] }
 */

// Static per deployment: a redeploy ships a new bundle anyway, so a long
// immutable TTL is safe and keeps repeat checkouts from re-requesting.
const CACHE_HEADER = "public, max-age=86400, stale-while-revalidate=604800"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const country = params.get("country")?.toUpperCase()
  const state = params.get("state")?.toUpperCase()

  if (!country) {
    return NextResponse.json(
      { message: "`country` is required" },
      { status: 400 }
    )
  }

  if (state) {
    const cities = City.getCitiesOfState(country, state).map((c) => ({
      name: c.name,
    }))

    return NextResponse.json({ cities }, { headers: { "Cache-Control": CACHE_HEADER } })
  }

  const states = State.getStatesOfCountry(country).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
  }))

  return NextResponse.json({ states }, { headers: { "Cache-Control": CACHE_HEADER } })
}
