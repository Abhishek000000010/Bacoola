import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
      <div className="relative h-full w-full group overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900">
        <Image
          src={leftImage}
          alt={leftTitle}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-1000 z-10" />
        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 z-20 text-white select-none">
          <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-[0.15em] mb-4 leading-none">
            {leftTitle}
          </h2>
          <div>
            <LocalizedClientLink
              href={link}
              className="text-white text-xs uppercase tracking-[0.25em] border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-all duration-300"
            >
              {ctaText}
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="relative h-full w-full group overflow-hidden">
        <Image
          src={rightImage}
          alt={rightTitle}
          fill
          loading="lazy"
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-1000 z-10" />
        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 z-20 text-white select-none">
          <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-[0.15em] mb-4 leading-none">
            {rightTitle}
          </h2>
          <div>
            <LocalizedClientLink
              href={link}
              className="text-white text-xs uppercase tracking-[0.25em] border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-all duration-300"
            >
              {ctaText}
            </LocalizedClientLink>
          </div>
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
      <Image
        src={image}
        alt={title}
        fill
        loading="lazy"
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10" />
      <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight uppercase mb-8 leading-none">
          {title}
        </h2>
        <div>
          <LocalizedClientLink
            href={link}
            className="text-white text-xs font-semibold uppercase tracking-[0.2em] hover:text-neutral-300 transition-colors duration-300"
          >
            {ctaText}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

const EditorialFlow = () => {
  return (
    <div className="relative w-full flex flex-col">
      {/* Section 3: 50 | 50 Cards */}
      <DoubleCampaign
        leftTitle="Shirts"
        leftImage="/images/campaign-1.jpg"
        rightTitle="Trousers"
        rightImage="/images/campaign-2.jpg"
      />

      {/* Section 4: 50 | 50 Cards */}
      <DoubleCampaign
        leftTitle="Shorts"
        leftImage="/images/campaign-3.jpg"
        rightTitle="Polos"
        rightImage="/images/campaign-4.jpg"
      />

      {/* Section 5: Full Width Hero Campaign */}
      <FullWidthCampaign
        title="The Suit Guide"
        image="/images/campaign-5.jpg"
      />

      {/* Section 6: Full Width Hero Campaign */}
      <FullWidthCampaign
        title="Linen"
        image="/images/campaign-6.jpg"
      />

      {/* Section 7: Full Width Campaign */}
      <FullWidthCampaign
        title="T-Shirt Guide"
        image="/images/hero-arrivals.jpg"
      />
    </div>
  )
}

export default EditorialFlow
