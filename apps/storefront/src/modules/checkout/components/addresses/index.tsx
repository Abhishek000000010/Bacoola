"use client"
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep = searchParams.get("step") || "address"
  // "delivery" is the same first step as "address" -- the cart's Checkout button
  // lands here when an address exists but no delivery method is chosen. Keep the
  // address form open for it too, or the left column renders blank.
  const isOpen = currentStep === "address" || currentStep === "delivery"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  if (!isOpen) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="mb-5 flex flex-col justify-center">
        <h2 className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] text-black">
          Delivery Details
        </h2>
      </div>
      <form action={formAction}>
        <div className="pb-7">
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
          />

          {!sameAsBilling && (
            <div>
              <Heading
                level="h2"
                className="pb-6 pt-7 text-base font-bold uppercase tracking-[0.05em] text-[#111111] text-center"
              >
                Billing Address
              </Heading>

              <div className="pt-5">
                <BillingAddress cart={cart} />
              </div>
            </div>
          )}

          {/* Account Creation Simulation for UI purposes */}
          <div className="mt-8 mb-6">
            <p className="text-[12px] lg:text-[14px] text-neutral-800 mb-4">
              Create your account in one step and manage your orders easily (optional)
            </p>
            <div className="relative mb-4">
              <input
                type="password"
                id="checkout-account-password"
                placeholder=" "
                className="peer w-full h-12 px-4 pt-[22px] pb-[6px] border border-neutral-300 text-[12px] lg:text-[14px] leading-none text-neutral-900 focus:outline-none focus:ring-0 focus:border-black"
              />
              <label
                htmlFor="checkout-account-password"
                data-no-global-float
                className="pointer-events-none absolute left-4 top-[7px] z-10 text-[12px] lg:text-[14px] leading-none text-neutral-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[12px] lg:text-[14px] peer-focus:top-[7px] peer-focus:translate-y-0 peer-focus:text-[12px] lg:text-[14px]"
              >
                Password
              </label>
            </div>
            <label htmlFor="newsletter" className="flex items-start gap-x-3 mt-2 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-[2px] h-4 w-4">
                <input 
                  type="checkbox" 
                  id="newsletter" 
                  className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="absolute inset-0 border border-black bg-transparent pointer-events-none" />
                <div className="hidden peer-checked:block absolute h-[8px] w-[8px] bg-black pointer-events-none" />
              </div>
              <span className="text-[12px] lg:text-[14px] text-neutral-900 select-none">
                I would like personalised offers, news and the latest trends
              </span>
            </label>
          </div>

          <SubmitButton
            className="mt-2 h-[50px] w-full rounded-none border border-black bg-black text-white px-6 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] transition-colors hover:bg-white hover:text-black"
            data-testid="submit-address-button"
          >
            Continue to Payment
          </SubmitButton>
          <p className="mt-4 text-left text-[12px] lg:text-[14px] text-neutral-600">
            By continuing, you confirm you have read the <span className="font-bold text-black border-b border-black cursor-pointer hover:text-neutral-500 hover:border-neutral-500">Privacy Policy</span>
          </p>
          <ErrorMessage error={message} data-testid="address-error-message" />
        </div>
      </form>
    </div>
  )
}

export default Addresses
