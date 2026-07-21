import React from "react"
import Hero from "@modules/home/components/hero"
import SplitBanner from "@modules/home/components/split-banner"
import EditorialBanner from "@modules/home/components/editorial-banner"
import Newsletter from "@modules/home/components/newsletter"

interface LandingRendererProps {
  sections: any[]
  pageName: string
}

export const LandingRenderer: React.FC<LandingRendererProps> = ({ sections, pageName }) => {
  // Safe extraction of strict layout slots based on layout_type
  const heroSection = sections?.find(s => s.layout_type === "hero_slider" || s.layout_type === "hero_banner")
  const splitBannerSection = sections?.find(s => s.layout_type === "split_banner")
  const editorialBanners = sections?.filter(s => s.layout_type === "editorial_banner") || []
  const productShowcaseSection = sections?.find(s => s.layout_type === "product_showcase")
  const newsletterSection = sections?.find(s => s.layout_type === "newsletter")

  // As per architecture:
  // Section 1: Hero Banner or Hero Slider
  // Section 2: Split Banner
  // Section 3: Editorial Banner (1st)
  // Section 4: Product Showcase (Rendered as 2 Full-Width Banners)
  // Section 5: Video Banner (Rendered externally or kept untouched)
  // Section 6: Newsletter

  return (
    <div className="relative w-full flex flex-col bg-neutral-900">
      {/* 1. Hero */}
      <Hero items={heroSection?.items} pageName={pageName} />
      
      {/* 2. Split Banner (Grid 1) */}
      <SplitBanner items={splitBannerSection?.items} />
      
      {/* 3. Editorial Banner (Grid 2, exactly like Homepage Section 3) */}
      <SplitBanner 
        items={editorialBanners[0]?.items} 
        fallbackItems={[
          { title: "Accessories", desktop_image: "/images/campaign-3.jpg", button_link: "/store", button_text: "SEE ALL" },
          { title: "Outerwear", desktop_image: "/images/campaign-4.jpg", button_link: "/store", button_text: "SEE ALL" }
        ]} 
      />
      
      {/* 4, 5, 6. Full Width Banners (Rendered exactly like Homepage Sections 4, 5, 6) */}
      <EditorialBanner items={productShowcaseSection?.items ? [productShowcaseSection.items[0]] : [{ title: "The Suit Guide", desktop_image: "/images/campaign-5.jpg", button_link: "/store", button_text: "DISCOVER MORE" }]} />
      <EditorialBanner items={productShowcaseSection?.items ? [productShowcaseSection.items[1]] : [{ title: "Winter Collection", desktop_image: "/images/campaign-6.jpg", button_link: "/store", button_text: "SHOP WINTER" }]} />
      <EditorialBanner items={productShowcaseSection?.items ? [productShowcaseSection.items[2]] : [{ title: "Essentials", desktop_image: "/images/campaign-7.jpg", button_link: "/store", button_text: "SHOP ESSENTIALS" }]} />
      
      {/* 7. Newsletter */}
      <Newsletter />
    </div>
  )
}

export default LandingRenderer
