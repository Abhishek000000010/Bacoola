import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default function Loading() {
  return (
    <div className="flex flex-col w-full bg-white">
      {/* Skeleton Breadcrumbs & Title Area */}
      <div className="w-full flex flex-col items-center pt-8 pb-10">
        <div className="w-32 h-[10px] bg-gray-200 animate-pulse mb-6" />
        <div className="w-48 h-6 bg-gray-200 animate-pulse" />
      </div>

      {/* Skeleton Tabs Area */}
      <div className="w-full px-8 sm:px-12 flex items-center gap-x-8 mb-6 border-b border-gray-100 pb-2">
        <div className="w-12 h-[10px] bg-gray-200 animate-pulse" />
        <div className="w-20 h-[10px] bg-gray-200 animate-pulse" />
        <div className="w-16 h-[10px] bg-gray-200 animate-pulse" />
      </div>

      {/* Product Grid Skeleton Container */}
      <div className="w-full mx-auto pb-16">
        <SkeletonProductGrid numberOfProducts={8} grid="4" />
      </div>
    </div>
  )
}
