const SkeletonCartTotals = ({ header = true }) => {
  return (
    <div className="py-2 flex flex-col">
      {header && <div className="w-32 h-4 bg-gray-200 animate-pulse mb-4"></div>}
      
      <div className="flex flex-col gap-y-2 text-[12px] lg:text-[14px] text-neutral-900 font-medium">
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-gray-200 animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 animate-pulse"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-gray-200 animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 animate-pulse"></div>
        </div>
      </div>

      <div className="flex items-start justify-between mt-6">
        <div className="flex flex-col">
          <div className="w-16 h-4 bg-gray-200 animate-pulse mb-1"></div>
          <div className="w-20 h-3 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="w-20 h-4 bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  )
}

export default SkeletonCartTotals
