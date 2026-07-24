import { Container } from "@modules/common/components/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="relative overflow-hidden group">
      {/* Aspect 2048/2867 Mango Image Placeholder with Shimmer Wave */}
      <div className="relative aspect-[2048/2867] w-full bg-neutral-100 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="flex justify-between items-center mt-2.5 px-0.5">
        <div className="w-1/2 h-3.5 bg-neutral-100 rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="w-1/4 h-3.5 bg-neutral-100 rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
