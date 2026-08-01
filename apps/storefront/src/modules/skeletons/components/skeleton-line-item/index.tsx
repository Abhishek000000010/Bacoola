import { Table } from "@modules/common/components/ui"

const SkeletonLineItem = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Product image skeleton */}
      <div className="relative w-full aspect-[3/4] bg-gray-200 animate-pulse overflow-hidden"></div>

      {/* Title + wishlist skeleton */}
      <div className="mt-2 pl-2 flex items-start justify-between gap-x-2">
        <div className="w-32 h-4 bg-gray-200 animate-pulse"></div>
        <div className="w-5 h-5 bg-gray-200 animate-pulse"></div>
      </div>

      {/* Price skeleton */}
      <div className="mt-1 pl-2 text-[12px] lg:text-[14px] font-normal text-neutral-900">
        <div className="w-16 h-4 bg-gray-200 animate-pulse"></div>
      </div>

      {/* Quantity stepper + variant skeleton */}
      <div className="mt-3 pl-2 flex items-center text-[12px] lg:text-[14px] text-neutral-900">
        <div className="w-20 h-5 bg-gray-200 animate-pulse mr-6"></div>
        <div className="w-10 h-5 bg-gray-200 animate-pulse mr-6"></div>
        <div className="w-12 h-5 bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  )
}

export default SkeletonLineItem
