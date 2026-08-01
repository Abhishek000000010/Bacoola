import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const labelClass =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400"
const valueClass = "text-[12px] leading-relaxed text-neutral-600 lg:text-[13px]"

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const address = order.shipping_address
  const method = order.shipping_methods?.[0] as
    | { name?: string; total?: number }
    | undefined

  return (
    <section className="border border-neutral-200">
      <header className="border-b border-neutral-200 px-5 py-4 lg:px-6">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950 lg:text-[14px]">
          Delivery
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[1fr_1.3fr_0.9fr] lg:px-6">
        <div data-testid="shipping-address-summary">
          <p className={labelClass}>Address</p>
          <div className={`mt-2 break-words ${valueClass}`}>
            <p className="text-neutral-800">
              {address?.first_name} {address?.last_name}
            </p>
            <p>
              {address?.address_1}
              {address?.address_2 ? `, ${address.address_2}` : ""}
            </p>
            <p>
              {address?.postal_code} {address?.city}
            </p>
            {address?.province && <p>{address.province}</p>}
            <p>{address?.country_code?.toUpperCase()}</p>
          </div>
        </div>

        <div data-testid="shipping-contact-summary">
          <p className={labelClass}>Contact</p>
          <div className={`mt-2 ${valueClass}`}>
            {address?.phone && <p className="break-words">{address.phone}</p>}
            <p className="[overflow-wrap:anywhere]">{order.email}</p>
          </div>
        </div>

        <div data-testid="shipping-method-summary">
          <p className={labelClass}>Method</p>
          <p className={`mt-2 break-words ${valueClass}`}>
            {method?.name}
            {method?.total !== undefined && (
              <span className="text-neutral-400">
                {" "}
                (
                {convertToLocale({
                  amount: method.total ?? 0,
                  currency_code: order.currency_code,
                })}
                )
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export default ShippingDetails
