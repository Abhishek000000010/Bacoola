import SkeletonCartTotals from "@modules/skeletons/components/skeleton-cart-totals"

const SkeletonOrderSummary = () => {
  return (
    <div className="flex flex-col w-full">
      <SkeletonCartTotals header={false} />

      <div className="w-full h-12 bg-gray-200 animate-pulse mt-6 mb-8"></div>

      <div className="w-full h-10 bg-gray-100 animate-pulse"></div>

      <div className="mt-6 flex flex-col gap-y-2 pt-6 border-t border-gray-100">
        <div className="w-40 h-4 bg-gray-200 animate-pulse"></div>
        <div className="w-48 h-4 bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  )
}

export default SkeletonOrderSummary
