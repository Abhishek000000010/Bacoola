import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LANDING_PAGE_MODULE } from "../../../../../modules/landing-pages"
import type { LandingPageService } from "../../../../../modules/landing-pages/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  const section = await landingPageService.retrieveLandingSection(req.params.id, {
    relations: ["items"]
  })

  if (section.items) {
    section.items.sort((a: any, b: any) => a.display_order - b.display_order)
  }

  res.json({ section })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  const body = req.body as Record<string, unknown>

  const section = await landingPageService.updateLandingSections({
    id: req.params.id,
    ...body,
  })

  res.json({ section })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)

  await landingPageService.deleteLandingSections(req.params.id)

  res.status(200).json({ id: req.params.id, deleted: true })
}
