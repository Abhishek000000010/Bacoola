import CloudinaryImage from "@modules/common/components/cloudinary-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

interface DoubleCampaignProps {
  leftTitle: string
  leftImage: string
  rightTitle: string
  rightImage: string
  ctaText?: string
  link?: string
}

const DoubleCampaign: React.FC<DoubleCampaignProps> = ({
  leftTitle,
  leftImage,
  rightTitle,
  rightImage,
  ctaText = "SEE ALL",
  link = "/store",
}) => {
  return (
    <section className="w-full h-[100vh] md:h-screen grid grid-cols-1 grid-rows-2 md:grid-rows-1 md:grid-cols-2 bg-neutral-900 overflow-hidden relative">
      {/* Left Column */}
      <div className="relative h-full w-full group overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900 flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={leftImage}
          alt={leftTitle}
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02] w-full h-full"
        />

        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-20 select-none">
          <h2 className="text-[13px] font-bold uppercase text-[#FDFDFD] leading-none">
            {leftTitle}
          </h2>
        </div>
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 select-none">
          <LocalizedClientLink
            href={link}
            className="text-[13px] font-bold uppercase text-[#FDFDFD] leading-none hover:text-neutral-300 transition-colors duration-300"
          >
            {ctaText}
          </LocalizedClientLink>
        </div>
      </div>

      {/* Right Column */}
      <div className="relative h-full w-full group overflow-hidden flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={rightImage}
          alt={rightTitle}
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02] w-full h-full"
        />

        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-20 select-none">
          <h2 className="text-[13px] font-bold uppercase text-[#FDFDFD] leading-none">
            {rightTitle}
          </h2>
        </div>
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 select-none">
          <LocalizedClientLink
            href={link}
            className="text-[13px] font-bold uppercase text-[#FDFDFD] leading-none hover:text-neutral-300 transition-colors duration-300"
          >
            {ctaText}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

interface FullWidthCampaignProps {
  title: string
  image: string
  ctaText?: string
  link?: string
}

const FullWidthCampaign: React.FC<FullWidthCampaignProps> = ({
  title,
  image,
  ctaText = "DISCOVER MORE",
  link = "/store",
}) => {
  return (
    <section className="w-full h-screen relative bg-neutral-900 overflow-hidden flex flex-col justify-center items-center text-center text-white">
      <div className="absolute inset-0 w-full h-full z-0 flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={image}
          alt={title}
          className="object-cover object-center w-full h-full"
        />
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center h-full w-full px-4 select-none mt-12 md:mt-0">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight uppercase text-white mb-4 text-center">
          {title}
        </h2>
        <LocalizedClientLink
          href={link}
          className="text-[12px] md:text-[13px] font-semibold uppercase tracking-[0.2em] text-white hover:text-neutral-300 transition-colors duration-300"
        >
          {ctaText}
        </LocalizedClientLink>
      </div>
    </section>
  )
}

interface EditorialFlowProps {
  sections?: any[]
  pageName?: string
}

// Ensure every fallback has exactly 7 items to perfectly match the strict layout
const fallbackContent: Record<string, any[]> = {
  home: [
    { title: "Shirts", desktop_image: "/images/campaign-1.jpg", button_link: "/store" },
    { title: "Trousers", desktop_image: "/images/campaign-2.jpg", button_link: "/store" },
    { title: "Shorts", desktop_image: "/images/campaign-3.jpg", button_link: "/store" },
    { title: "Polos", desktop_image: "/images/campaign-4.jpg", button_link: "/store" },
    { title: "The Suit Guide", desktop_image: "/images/campaign-5.jpg", button_link: "/store" },
    { title: "Linen", desktop_image: "/images/campaign-6.jpg", button_link: "/store" },
    { title: "T-Shirt Guide", desktop_image: "/images/hero-arrivals.jpg", button_link: "/store" },
  ],
  women: [
    { title: "Dresses", desktop_image: "https://images.unsplash.com/photo-1515347619152-16982f81498b?q=80&w=2070", button_link: "/categories/women" },
    { title: "Tops", desktop_image: "https://images.unsplash.com/photo-1434389678216-5606e3009516?q=80&w=2070", button_link: "/categories/women" },
    { title: "Skirts", desktop_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070", button_link: "/categories/women" },
    { title: "Blouses", desktop_image: "https://images.unsplash.com/photo-1515347619152-16982f81498b?q=80&w=2070", button_link: "/categories/women" },
    { title: "Summer Collection", desktop_image: "https://images.unsplash.com/photo-1434389678216-5606e3009516?q=80&w=2070", button_link: "/categories/women" },
    { title: "Autumn Collection", desktop_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070", button_link: "/categories/women" },
    { title: "Winter Collection", desktop_image: "https://images.unsplash.com/photo-1515347619152-16982f81498b?q=80&w=2070", button_link: "/categories/women" },
  ],
  men: [
    { title: "Shirts", desktop_image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974", button_link: "/categories/men" },
    { title: "Trousers", desktop_image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1974", button_link: "/categories/men" },
    { title: "Shorts", desktop_image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2071", button_link: "/categories/men" },
    { title: "Polos", desktop_image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974", button_link: "/categories/men" },
    { title: "The Suit Guide", desktop_image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1974", button_link: "/categories/men" },
    { title: "Linen", desktop_image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2071", button_link: "/categories/men" },
    { title: "T-Shirt Guide", desktop_image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974", button_link: "/categories/men" },
  ],
  kids: [
    { title: "Playtime Ready", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "School Essentials", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "Summer Fun", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "Winter Warmth", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "Accessories", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "Shoes", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
    { title: "Outerwear", desktop_image: "https://images.unsplash.com/photo-1514090259040-c3d3a7894a73?q=80&w=2070", button_link: "/categories/kids" },
  ],
  teen: [
    { title: "Denim", desktop_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Jackets", desktop_image: "https://images.unsplash.com/photo-1550614000-4b95dd2dbcc5?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Graphic Tees", desktop_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Sneakers", desktop_image: "https://images.unsplash.com/photo-1550614000-4b95dd2dbcc5?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Backpacks", desktop_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Hoodies", desktop_image: "https://images.unsplash.com/photo-1550614000-4b95dd2dbcc5?q=80&w=2070", button_link: "/categories/teen" },
    { title: "Caps", desktop_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=2070", button_link: "/categories/teen" },
  ],
}

const EditorialFlow: React.FC<EditorialFlowProps> = ({ sections, pageName = "home" }) => {
  // 1. Flatten all items from all incoming CMS sections
  let flatItems: any[] = []
  if (sections && sections.length > 0) {
    flatItems = sections.flatMap((s) => s.items || [])
  }

  // 2. Load the base strict fallback layout (always 7 items long)
  const baseItems = fallbackContent[pageName] || fallbackContent["home"]

  // 3. Deep merge CMS data over the strict base layout
  const mergedItems = baseItems.map((fallbackItem, index) => {
    const cmsItem = flatItems[index]
    
    // If CMS ran out of items, pad with the fallback item completely
    if (!cmsItem) return fallbackItem 
    
    // Deep merge field-by-field. If CMS is missing a field, cascade to fallback.
    return {
      title: cmsItem.title || fallbackItem.title,
      // Cascading image check: CMS Desktop -> CMS Mobile -> Fallback Desktop
      desktop_image: cmsItem.desktop_image || cmsItem.mobile_image || fallbackItem.desktop_image,
      button_text: cmsItem.button_text || fallbackItem.button_text,
      button_link: cmsItem.button_link || fallbackItem.button_link,
    }
  })

  // 4. Force the items into the strict Homepage layout sequence (Double, Double, Full, Full, Full)
  return (
    <div className="relative w-full flex flex-col">
      {/* Slot 1: Double Campaign (Requires 2 items) */}
      <DoubleCampaign
        leftTitle={mergedItems[0].title || ""}
        leftImage={mergedItems[0].desktop_image || ""}
        rightTitle={mergedItems[1].title || ""}
        rightImage={mergedItems[1].desktop_image || ""}
        ctaText={mergedItems[0].button_text || "SEE ALL"}
        link={mergedItems[0].button_link || "/store"}
      />

      {/* Slot 2: Double Campaign (Requires 2 items) */}
      <DoubleCampaign
        leftTitle={mergedItems[2].title || ""}
        leftImage={mergedItems[2].desktop_image || ""}
        rightTitle={mergedItems[3].title || ""}
        rightImage={mergedItems[3].desktop_image || ""}
        ctaText={mergedItems[2].button_text || "SEE ALL"}
        link={mergedItems[2].button_link || "/store"}
      />

      {/* Slot 3: Full Width Campaign */}
      <FullWidthCampaign
        title={mergedItems[4].title || ""}
        image={mergedItems[4].desktop_image || ""}
        ctaText={mergedItems[4].button_text || "DISCOVER MORE"}
        link={mergedItems[4].button_link || "/store"}
      />

      {/* Slot 4: Full Width Campaign */}
      <FullWidthCampaign
        title={mergedItems[5].title || ""}
        image={mergedItems[5].desktop_image || ""}
        ctaText={mergedItems[5].button_text || "DISCOVER MORE"}
        link={mergedItems[5].button_link || "/store"}
      />

      {/* Slot 5: Full Width Campaign */}
      <FullWidthCampaign
        title={mergedItems[6].title || ""}
        image={mergedItems[6].desktop_image || ""}
        ctaText={mergedItems[6].button_text || "DISCOVER MORE"}
        link={mergedItems[6].button_link || "/store"}
      />
    </div>
  )
}

export default EditorialFlow
