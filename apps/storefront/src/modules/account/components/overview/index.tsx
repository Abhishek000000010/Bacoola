import { Container } from "@modules/common/components/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper" className="w-full flex flex-col pt-[16px] font-sans text-[#111111]">
      <div className="hidden small:block w-full">
        {/* Header Greeting */}
        <div className="text-[13px] flex justify-between items-center mb-8 border-b border-neutral-100 pb-4">
          <span className="font-bold uppercase tracking-wide" data-testid="welcome-message" data-value={customer?.first_name}>
            Hello {customer?.first_name}
          </span>
          <span className="text-[#555555]">
            Signed in as:{" "}
            <span
              className="font-bold text-[#111111]"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </span>
        </div>

        {/* Gray Banner */}
        {getProfileCompletion(customer) < 100 && (
          <div className="bg-[#f2f2f2] px-6 py-5 flex justify-between items-start mb-[48px]">
            <div className="flex flex-col gap-y-3">
              <p className="text-[13px] text-[#111111] leading-[1.6]">
                Complete your profile to manage your orders easily and receive personalized content.
              </p>
              <LocalizedClientLink
                href="/account/profile"
                className="text-[11px] font-bold uppercase tracking-wider text-[#111111] hover:text-[#555555] transition-colors"
              >
                COMPLETE
              </LocalizedClientLink>
            </div>
            <button className="text-[#555555] hover:text-[#111111] transition-colors ml-4 shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Up to date section */}
        <div className="flex flex-col items-start mb-[64px]">
          <h2 className="text-[13px] font-bold uppercase tracking-wide mb-2">
            YOU'RE UP TO DATE
          </h2>
          <p className="text-[13px] leading-[1.6] mb-6">
            Discover new arrivals, collections, and pieces that suit you.
          </p>
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center h-[44px] px-8 bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors"
          >
            SEE WHAT'S NEW
          </LocalizedClientLink>
        </div>

        {/* Recent Orders */}
        <div className="flex flex-col">
          <div className="flex items-center mb-6">
            <h3 className="text-[13px] font-bold uppercase tracking-wide">Recent orders</h3>
          </div>
          <ul
            className="flex flex-col gap-y-4"
            data-testid="orders-wrapper"
          >
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => {
                return (
                  <li
                    key={order.id}
                    data-testid="order-wrapper"
                    data-value={order.id}
                  >
                    <LocalizedClientLink
                      href={`/account/orders/details/${order.id}`}
                    >
                      <Container className="bg-[#f9f9f9] border-none shadow-none flex justify-between items-center p-6 hover:bg-[#f2f2f2] transition-colors">
                        <div className="grid grid-cols-3 grid-rows-2 text-[12px] gap-x-4 gap-y-1 flex-1">
                          <span className="font-bold text-[#777777] uppercase tracking-wider text-[10px]">Date placed</span>
                          <span className="font-bold text-[#777777] uppercase tracking-wider text-[10px]">
                            Order number
                          </span>
                          <span className="font-bold text-[#777777] uppercase tracking-wider text-[10px]">
                            Total amount
                          </span>
                          <span className="text-[#111111]" data-testid="order-created-date">
                            {new Date(order.created_at).toDateString()}
                          </span>
                          <span className="text-[#111111]"
                            data-testid="order-id"
                            data-value={order.display_id}
                          >
                            #{order.display_id}
                          </span>
                          <span className="font-semibold text-[#111111]" data-testid="order-amount">
                            {convertToLocale({
                              amount: order.total,
                              currency_code: order.currency_code,
                            })}
                          </span>
                        </div>
                        <button
                          className="flex items-center justify-between ml-6 text-[#111111]"
                          data-testid="open-order-button"
                        >
                          <span className="sr-only">
                            Go to order #{order.display_id}
                          </span>
                          <ChevronDown className="-rotate-90 w-4 h-4" />
                        </button>
                      </Container>
                    </LocalizedClientLink>
                  </li>
                )
              })
            ) : (
              <span className="text-[13px] text-[#555555]" data-testid="no-orders-message">No recent orders</span>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
