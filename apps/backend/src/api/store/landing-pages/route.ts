import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LANDING_PAGE_MODULE } from "../../../modules/landing-pages"
import type { LandingPageService } from "../../../modules/landing-pages/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(
    LANDING_PAGE_MODULE
  )

  const filters: Record<string, unknown> = {}
  const pageFilter = req.query.page as string | undefined

  if (pageFilter) {
    filters.page = pageFilter
  }

  const sections = await landingPageService.listLandingSections(filters, {
    relations: ["items"],
    order: { display_order: "ASC" },
  })

  sections.forEach((section: any) => {
    if (section.items) {
      section.items.sort((a: any, b: any) => a.display_order - b.display_order)
    }
  })

  res.json({ sections })
}
