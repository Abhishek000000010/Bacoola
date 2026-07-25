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
  const isOpen = currentStep === "address"

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
        <h2 className="text-[11px] font-bold uppercase tracking-[0.05em] text-black">
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
            <p className="text-[13px] text-neutral-800 mb-4">
              Create your account in one step and manage your orders easily (optional)
            </p>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                className="w-full h-12 px-4 border border-neutral-300 text-[13px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex items-start gap-x-3">
              <input type="checkbox" id="newsletter" className="mt-1 h-4 w-4 border-neutral-300 text-black focus:ring-black" />
              <label htmlFor="newsletter" className="text-[13px] text-neutral-800">
                I would like personalised offers, news and the latest trends
              </label>
            </div>
          </div>

          <SubmitButton
            className="mt-2 h-[50px] w-full rounded-none bg-black text-white px-6 text-[11px] font-bold uppercase tracking-[0.05em] hover:bg-neutral-800"
            data-testid="submit-address-button"
          >
            Continue to Payment
          </SubmitButton>
          <p className="mt-4 text-center text-[11px] text-neutral-600">
            By continuing, you confirm you have read the <span className="font-bold text-black border-b border-black cursor-pointer hover:text-neutral-500 hover:border-neutral-500">Privacy Policy</span>
          </p>
          <ErrorMessage error={message} data-testid="address-error-message" />
        </div>
      </form>
      <Divider className="mt-10 border-neutral-200" />
    </div>
  )
}

export default Addresses
