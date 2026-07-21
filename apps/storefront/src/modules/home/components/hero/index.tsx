import CloudinaryImage from "@modules/common/components/cloudinary-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface HeroProps {
  items?: any[]
  pageName?: string
}

const fallbackCampaigns: Record<string, any[]> = {
  home: [
    {
      id: "new-now",
      title: "New Now",
      button_text: "Discover More",
      button_link: "/store",
      desktop_image: "/images/hero-newnow.jpg",
    },
    {
      id: "vacation-collection",
      title: "Vacation",
      button_text: "Discover More",
      button_link: "/store",
      desktop_image: "/images/hero-vacation.jpg",
    },
  ],
  women: [
    {
      id: "women-spring",
      title: "Spring Collection",
      button_text: "Shop Women",
      button_link: "/categories/women",
      desktop_image: "/images/campaign-1.jpg",
    },
    {
      id: "women-dresses",
      title: "Elegant Dresses",
      button_text: "Discover More",
      button_link: "/categories/women",
      desktop_image: "/images/campaign-2.jpg",
    },
  ],
  men: [
    {
      id: "men-essentials",
      title: "Modern Essentials",
      button_text: "Shop Men",
      button_link: "/categories/men",
      desktop_image: "/videos/men-hero.mp4",
    },
  ],
  kids: [
    {
      id: "kids-play",
      title: "Playtime Ready",
      button_text: "Shop Kids",
      button_link: "/categories/kids",
      desktop_image: "/images/campaign-4.jpg",
    },
  ],
  teen: [
    {
      id: "teen-style",
      title: "Teen Style",
      button_text: "Shop Teen",
      button_link: "/categories/teen",
      desktop_image: "/images/campaign-5.jpg",
    },
  ]
}

const Hero: React.FC<HeroProps> = ({ items, pageName = "home" }) => {
  const fallback = fallbackCampaigns[pageName] || fallbackCampaigns["home"]
  
  // Merge CMS items with fallback items to guarantee no broken fields
  const activeItems = (items && items.length > 0 ? items : fallback).map((cmsItem, index) => {
    const fallbackItem = fallback[index] || fallback[0]
    return {
      id: cmsItem.id || fallbackItem.id,
      title: cmsItem.title || fallbackItem.title,
      button_text: cmsItem.button_text || fallbackItem.button_text,
      button_link: cmsItem.button_link || fallbackItem.button_link,
      desktop_image: cmsItem.desktop_image || cmsItem.mobile_image || fallbackItem.desktop_image,
    }
  })

  return (
    <div className="relative w-full flex flex-col bg-neutral-900">
      {activeItems.map((campaign, index) => (
        <section
          key={campaign.id}
          className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white"
          role="region"
          aria-label={`Editorial Campaign: ${campaign.title}`}
        >
          {/* Full Screen Background Image */}
          <div className="absolute inset-0 w-full h-full z-0 flex [&>picture]:w-full [&>picture]:h-full">
            <CloudinaryImage
              src={campaign.desktop_image}
              alt={campaign.title || "Hero Campaign"}
              priority={index === 0}
              className="object-cover object-center w-full h-full"
            />
            {/* Subtle overlay for typography readability */}

          </div>

          {/* Centered Typography & Minimalist CTA */}
          <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase text-white mb-8 leading-none">
              {campaign.title}
            </h1>
            <div>
              <LocalizedClientLink
                href={campaign.button_link || "/store"}
                className="text-white text-xs font-semibold uppercase tracking-[0.2em] hover:text-neutral-300 transition-colors duration-300"
              >
                {campaign.button_text || "Discover More"}
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export default Hero
