import { Metadata } from "next"
import SearchTemplate from "@modules/search/templates/search-template"

import PaginatedProducts from "@modules/store/templates/paginated-products"
import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export const metadata: Metadata = {
  title: "Search",
  description: "Search for products.",
}

type Params = {
  searchParams: Promise<{ q?: string }>
  params: Promise<{ countryCode: string }>
}

export default async function SearchPage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const query = searchParams.q;

  return (
    <SearchTemplate countryCode={params?.countryCode || "us"} query={query}>
      {query && (
        <div className="w-full">
          <h2 className="text-lg md:text-xl font-medium tracking-wide mb-8 uppercase text-gray-800">
            Results for: <span className="font-bold border-b border-black">{query}</span>
          </h2>
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              page={1}
              countryCode={params?.countryCode || "us"}
              q={query}
            />
          </Suspense>
        </div>
      )}
    </SearchTemplate>
  )
}
