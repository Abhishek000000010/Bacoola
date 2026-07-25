import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default function PreviewPrice({ price, isMobileLayout }: { price: VariantPrice, isMobileLayout?: boolean }) {
  if (!price) {
    return null
  }

  if (isMobileLayout) {
    return (
      <div className="flex items-center gap-x-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        {price.price_type === "sale" && (
          <span className="line-through text-gray-500 font-normal">
            {price.original_price}
          </span>
        )}
        <span className={price.price_type === "sale" ? "text-[#D01313] font-normal" : "text-[#333333] font-normal"}>
          {price.calculated_price}
        </span>
      </div>
    )
  }

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </>
  )
}
