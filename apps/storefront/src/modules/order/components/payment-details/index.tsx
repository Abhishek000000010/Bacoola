import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const labelClass =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400"
const valueClass = "text-[12px] leading-relaxed text-neutral-600 lg:text-[13px]"

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  if (!payment) {
    return null
  }

  const info = paymentInfoMap[payment.provider_id]

  return (
    <section className="border border-neutral-200">
      <header className="border-b border-neutral-200 px-5 py-4 lg:px-6">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950 lg:text-[14px]">
          Payment
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-3 lg:px-6">
        <div>
          <p className={labelClass}>Method</p>
          <p className={`mt-2 break-words ${valueClass}`} data-testid="payment-method">
            {info?.title ?? payment.provider_id}
          </p>
        </div>

        <div className="lg:col-span-2">
          <p className={labelClass}>Details</p>
          <p className={`mt-2 break-words ${valueClass}`} data-testid="payment-amount">
            {isStripeLike(payment.provider_id) && payment.data?.card_last4
              ? `•••• •••• •••• ${payment.data.card_last4}`
              : `${convertToLocale({
                  amount: payment.amount,
                  currency_code: order.currency_code,
                })} paid · ${new Date(
                  payment.created_at ?? ""
                ).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
          </p>
        </div>
      </div>
    </section>
  )
}

export default PaymentDetails
