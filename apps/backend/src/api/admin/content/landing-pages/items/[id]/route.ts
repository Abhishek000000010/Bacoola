import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LANDING_PAGE_MODULE } from "../../../../../../modules/landing-pages"
import type { LandingPageService } from "../../../../../../modules/landing-pages/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  const body = req.body as Record<string, unknown>

  const item = await landingPageService.updateLandingSectionItems({
    id: req.params.id,
    ...body,
  })

  res.json({ item })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  await landingPageService.deleteLandingSectionItems(req.params.id)

  res.status(200).json({ id: req.params.id, deleted: true })
}
