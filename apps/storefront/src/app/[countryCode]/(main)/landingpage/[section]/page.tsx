import { notFound } from "next/navigation"
import { getLandingSections } from "@lib/data/landing-pages"
import { getCategoryByHandle } from "@lib/data/categories"
import LandingRenderer from "@modules/home/components/landing-renderer"
import SubcategorySlider from "@modules/categories/components/subcategory-slider"

type Props = {
  params: Promise<{
    countryCode: string
    section: string
  }>
}

const VALID_SECTIONS = ["men", "women", "teen", "kids", "home"]

export default async function LandingPage(props: Props) {
  const params = await props.params
  const section = params.section?.toLowerCase()

  if (!section || !VALID_SECTIONS.includes(section)) {
    notFound()
  }

  const [sections, category] = await Promise.all([
    getLandingSections(section),
    getCategoryByHandle([section]),
  ])

  return (
    <main className="w-full min-h-screen bg-white">
      <LandingRenderer
        sections={sections}
        pageName={section}
        preFooter={category ? <SubcategorySlider category={category} /> : null}
      />
    </main>
  )
}
