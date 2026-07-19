export interface EditorialRowConfig {
  leftTitle: string
  leftImage: string
  leftSpan: string
  leftSlug: string
  rightTitle: string
  rightImage: string
  rightSpan: string
  rightSlug: string
}

export interface FullWidthBannerConfig {
  title: string
  image: string
  slug: string
}

export interface NavConfig {
  title: string
  slug: string
}

export interface CategoryLandingConfig {
  heroTitle: string
  heroImage: string
  heroCta: string
  grid: EditorialRowConfig[]
  fullWidthBanners?: FullWidthBannerConfig[]
}

export const categoryEditorialConfigs: Record<string, CategoryLandingConfig> = {
  women: {
    heroTitle: "New Now",
    heroImage: "/images/hero-newnow.jpg",
    heroCta: "Explore Collection",
    grid: [
      {
        leftTitle: "Dresses",
        leftImage: "/images/lookbook-1.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "dresses",
        rightTitle: "Linen",
        rightImage: "/images/hero-linen.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "linen",
      },
      {
        leftTitle: "Shoes",
        leftImage: "/images/lookbook-3.jpg",
        leftSpan: "md:col-span-2",
        leftSlug: "shoes",
        rightTitle: "Accessories",
        rightImage: "/images/lookbook-4.jpg",
        rightSpan: "md:col-span-3",
        rightSlug: "accessories",
      },
      {
        leftTitle: "Evening Wear",
        leftImage: "/images/lookbook-5.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "evening-wear",
        rightTitle: "Bags",
        rightImage: "/images/lookbook-2.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "bags",
      },
    ],
    fullWidthBanners: [
      { title: "The Suit Guide", image: "/images/campaign-5.jpg", slug: "suits" },
      { title: "Linen", image: "/images/campaign-6.jpg", slug: "linen" },
      { title: "T-Shirt Guide", image: "/images/hero-arrivals.jpg", slug: "t-shirts" },
    ],
  },
  men: {
    heroTitle: "Vacation",
    heroImage: "/images/hero-vacation.jpg",
    heroCta: "Shop Collection",
    grid: [
      {
        leftTitle: "Shirts",
        leftImage: "/images/campaign-7.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "shirts",
        rightTitle: "T-Shirts",
        rightImage: "/images/campaign-3.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "t-shirts",
      },
      {
        leftTitle: "Linen",
        leftImage: "/images/hero-summer.jpg",
        leftSpan: "md:col-span-2",
        leftSlug: "linen",
        rightTitle: "Suits",
        rightImage: "/images/campaign-8.jpg",
        rightSpan: "md:col-span-3",
        rightSlug: "suits",
      },
      {
        leftTitle: "Shoes",
        leftImage: "/images/campaign-2.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "shoes",
        rightTitle: "Accessories",
        rightImage: "/images/campaign-1.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "accessories",
      },
    ],
    fullWidthBanners: [
      { title: "The Suit Guide", image: "/images/campaign-5.jpg", slug: "suits" },
      { title: "Linen", image: "/images/campaign-6.jpg", slug: "linen" },
      { title: "T-Shirt Guide", image: "/images/hero-arrivals.jpg", slug: "t-shirts" },
    ],
  },
  teen: {
    heroTitle: "Summer Club",
    heroImage: "/images/campaign-5.jpg",
    heroCta: "Discover More",
    grid: [
      {
        leftTitle: "Casual Wear",
        leftImage: "/images/campaign-4.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "casual-wear",
        rightTitle: "Denim",
        rightImage: "/images/lookbook-6.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "denim",
      },
      {
        leftTitle: "Sneakers",
        leftImage: "/images/lookbook-8.jpg",
        leftSpan: "md:col-span-2",
        leftSlug: "sneakers",
        rightTitle: "Bags",
        rightImage: "/images/lookbook-7.jpg",
        rightSpan: "md:col-span-3",
        rightSlug: "bags",
      },
      {
        leftTitle: "New Arrivals",
        leftImage: "/images/hero-arrivals.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "new-arrivals",
        rightTitle: "Featured",
        rightImage: "/images/campaign-6.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "featured",
      },
    ],
    fullWidthBanners: [
      { title: "The Suit Guide", image: "/images/campaign-5.jpg", slug: "suits" },
      { title: "Linen", image: "/images/campaign-6.jpg", slug: "linen" },
      { title: "T-Shirt Guide", image: "/images/hero-arrivals.jpg", slug: "t-shirts" },
    ],
  },
  kids: {
    heroTitle: "Playtime",
    heroImage: "/images/campaign-7.jpg",
    heroCta: "Explore Kids",
    grid: [
      {
        leftTitle: "Girls",
        leftImage: "/images/lookbook-3.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "girls",
        rightTitle: "Boys",
        rightImage: "/images/lookbook-4.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "boys",
      },
      {
        leftTitle: "Baby",
        leftImage: "/images/lookbook-5.jpg",
        leftSpan: "md:col-span-2",
        leftSlug: "baby",
        rightTitle: "Shoes",
        rightImage: "/images/lookbook-1.jpg",
        rightSpan: "md:col-span-3",
        rightSlug: "shoes",
      },
      {
        leftTitle: "Summer",
        leftImage: "/images/hero-summeredit.jpg",
        leftSpan: "md:col-span-3",
        leftSlug: "summer",
        rightTitle: "School",
        rightImage: "/images/campaign-1.jpg",
        rightSpan: "md:col-span-2",
        rightSlug: "school",
      },
    ],
    fullWidthBanners: [
      { title: "The Suit Guide", image: "/images/campaign-5.jpg", slug: "suits" },
      { title: "Linen", image: "/images/campaign-6.jpg", slug: "linen" },
      { title: "T-Shirt Guide", image: "/images/hero-arrivals.jpg", slug: "t-shirts" },
    ],
  },
}
