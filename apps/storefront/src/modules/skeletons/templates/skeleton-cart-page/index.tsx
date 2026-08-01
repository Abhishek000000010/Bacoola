import repeat from "@lib/util/repeat"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import SkeletonOrderSummary from "@modules/skeletons/components/skeleton-order-summary"

const SkeletonCartPage = () => {
  return (
    <div className="pt-4 pb-12">
      <div className="w-full pl-0 pr-4 lg:pr-12">
        <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-12 lg:gap-x-24">
          <div className="flex flex-col bg-white py-6 gap-y-6 lg:max-w-[580px] xl:max-w-[620px] 2xl:max-w-[660px]">
            <div className="w-full">
              <div className="mb-4 flex items-center pl-4 lg:pl-6">
                <div className="w-48 h-6 bg-gray-200 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-x-1 gap-y-10 w-full">
                {repeat(4).map((index) => (
                  <SkeletonLineItem key={index} />
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="flex flex-col gap-y-8 sticky top-12 mt-[44px]">
              <div className="bg-white py-6">
                <div className="mb-8 flex flex-col gap-y-2">
                  <div className="w-48 h-4 bg-gray-200 animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 animate-pulse mt-2"></div>
                </div>
                <SkeletonOrderSummary />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartPage
