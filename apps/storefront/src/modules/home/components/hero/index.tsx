import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeroSlide } from "./types"

const campaigns: HeroSlide[] = [
  {
    id: "new-now",
    title: "New Now",
    ctaText: "Discover More",
    link: "/store",
    imageSrc: "/images/hero-newnow.jpg",
    imageAlt: "Minimal campaign model showcasing new arrivals in neutral tones",
  },
  {
    id: "vacation-collection",
    title: "Vacation",
    ctaText: "Discover More",
    link: "/store",
    imageSrc: "/images/hero-vacation.jpg",
    imageAlt: "Summer holiday model posing in minimalist vacation clothing",
  },
]

const Hero = () => {
  return (
    <div className="relative w-full flex flex-col bg-neutral-900">
      {campaigns.map((campaign, index) => (
        <section
          key={campaign.id}
          className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white"
          role="region"
          aria-label={`Editorial Campaign: ${campaign.title}`}
        >
          {/* Full Screen Background Image */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src={campaign.imageSrc}
              alt={campaign.imageAlt}
              fill
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Subtle overlay for typography readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10" />
          </div>

          {/* Centered Typography & Minimalist CTA */}
          <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase text-white mb-8 leading-none">
              {campaign.title}
            </h1>
            <div>
              <LocalizedClientLink
                href={campaign.link}
                className="text-white text-xs font-semibold uppercase tracking-[0.2em] hover:text-neutral-300 transition-colors duration-300"
              >
                {campaign.ctaText}
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

export default Hero
