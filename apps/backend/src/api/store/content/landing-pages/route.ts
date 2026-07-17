import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LANDING_PAGE_MODULE } from "../../../../modules/landing-pages"
import type { LandingPageService } from "../../../../modules/landing-pages/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const landingPageService: LandingPageService = req.scope.resolve(LANDING_PAGE_MODULE)
  
  const page = req.query.page as string

  if (!page) {
    return res.status(400).json({ message: "Page query parameter is required" })
  }

  const sections = await landingPageService.listLandingSections(
    { page, is_visible: true },
    { relations: ["items"] }
  )

  // Sort sections by display_order
  sections.sort((a, b) => a.display_order - b.display_order)

  // Sort items within each section and filter visible items
  sections.forEach(section => {
    if (section.items) {
      section.items = section.items
        .filter(item => item.is_visible)
        .sort((a, b) => a.display_order - b.display_order)
    }
  })

  res.json({ sections })
}
