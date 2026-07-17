import { model } from "@medusajs/framework/utils"
import { LandingSection } from "./landing-section"

export const LandingSectionItem = model.define("landing_section_item", {
  id: model.id().primaryKey(),
  item_type: model.enum(["card", "slide", "video", "text", "custom"]).default("card"),
  title: model.text().nullable(),
  subtitle: model.text().nullable(),
  description: model.text().nullable(),
  desktop_image: model.text().nullable(),
  mobile_image: model.text().nullable(),
  video_url: model.text().nullable(),
  button_text: model.text().nullable(),
  button_link: model.text().nullable(),
  alignment: model.enum(["left", "center", "right"]).default("center"),
  image_position: model.enum([
    "center center",
    "center top",
    "center bottom",
    "left center",
    "right center",
    "left top",
    "right top",
    "left bottom",
    "right bottom",
  ]).default("center center"),
  display_order: model.number().default(0),
  is_visible: model.boolean().default(true),
  metadata: model.json().nullable(),
  landing_section: model.belongsTo(() => LandingSection, {
    mappedBy: "items",
  })
})
