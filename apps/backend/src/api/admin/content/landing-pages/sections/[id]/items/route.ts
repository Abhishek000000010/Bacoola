import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LANDING_PAGE_MODULE } from "../../../../../../../modules/landing-pages"
import type { LandingPageService } from "../../../../../../../modules/landing-pages/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  const items = await landingPageService.listLandingSectionItems({
    landing_section: req.params.id
  }, {
    order: { display_order: "ASC" },
  })

  res.json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  const payload = req.body as Record<string, unknown>
  payload.landing_section_id = req.params.id

  const item = await landingPageService.createLandingSectionItems(payload)

  res.status(201).json({ item })
}
