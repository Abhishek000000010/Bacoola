import { MedusaService } from "@medusajs/framework/utils"
import { LandingSection } from "./models/landing-section"
import { LandingSectionItem } from "./models/landing-section-item"

export class LandingPageService extends MedusaService({
  LandingSection,
  LandingSectionItem,
}) {}
