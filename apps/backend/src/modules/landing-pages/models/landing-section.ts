import { model } from "@medusajs/framework/utils"
import { LandingSectionItem } from "./landing-section-item"

export const LandingSection = model.define("landing_section", {
  id: model.id().primaryKey(),
  page: model.enum(["home", "men", "women", "kids", "teen"]),
  section_key: model.text(),
  layout_type: model.enum(["hero_slider", "split_banner", "editorial_banner", "product_showcase", "video_banner", "newsletter", "custom"]).default("custom"),
  display_order: model.number().default(0),
  is_visible: model.boolean().default(true),
  max_items: model.number().nullable(),
  items: model.hasMany(() => LandingSectionItem, {
    mappedBy: "landing_section"
  })
})
