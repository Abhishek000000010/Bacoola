import { Metadata } from "next"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your saved items.",
}

export default async function WishlistPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  // Fetch a few products for the "Popular Right Now" section
  const {
    response: { products: popularProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 4,
      fields: "*variants.calculated_price",
    },
  })

  return (
    <div className="w-full flex flex-col font-sans text-[#111111] pb-24">
      
      {/* Top Header Section */}
      <div className="w-full px-6 sm:px-8 xl:px-10 pt-8">
        <h1 className="text-[14px] font-bold uppercase tracking-[0.05em]">
          My Wishlist
        </h1>
      </div>

      {/* Empty State Section */}
      <div className="w-full flex flex-col items-center justify-center pt-24 pb-32 px-6">
        <h2 className="text-[14px] font-bold uppercase tracking-[0.05em] mb-6">
          Your Wishlist is Empty
        </h2>
        
        <div className="flex flex-col items-start gap-y-3">
          <div className="flex items-center gap-x-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-[14px] h-[14px]" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[13px] tracking-wide">Use the hearts to add or remove favourites</span>
          </div>
          <div className="flex items-center gap-x-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-[14px] h-[14px]" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[13px] tracking-wide">Access your wishlist from any device</span>
          </div>
        </div>
      </div>

      {/* Popular Right Now Section */}
      {popularProducts && popularProducts.length > 0 && (
        <div className="w-full mt-12">
          {/* Header & Arrows */}
          <div className="w-full flex items-center justify-between px-6 sm:px-8 xl:px-10 mb-6">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.05em]">
              Popular Right Now
            </h2>
            
            <div className="flex items-center gap-x-4">
              <button className="text-gray-400 hover:text-black transition-colors" aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="text-gray-900 hover:text-gray-500 transition-colors" aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-4 px-6 sm:px-8 xl:px-10">
            {popularProducts.map((product) => (
              <ProductPreview
                key={product.id}
                product={product}
                region={region}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
