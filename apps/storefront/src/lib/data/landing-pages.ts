import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type LandingSectionItem = {
  id: string
  landing_section_id: string
  item_type: string
  title: string | null
  subtitle: string | null
  description: string | null
  desktop_image: string | null
  mobile_image: string | null
  video_url: string | null
  button_text: string | null
  button_link: string | null
  image_position: string | null
  alignment: string
  display_order: number
  is_visible: boolean
  metadata: Record<string, any> | null
}

export type LandingSection = {
  id: string
  page: string
  section_key: string
  layout_type: string
  display_order: number
  is_visible: boolean
  max_items: number | null
  items: LandingSectionItem[]
}

export const getLandingSections = async (page: string) => {
  const next = {
    ...(await getCacheOptions("landing_pages")),
  }

  return sdk.client
    .fetch<{ sections: LandingSection[] }>(`/store/content/landing-pages`, {
      query: { page },
      next,
      cache: "no-store",
    })
    .then(({ sections }: any) => sections)
    .catch(() => [] as LandingSection[])
}
