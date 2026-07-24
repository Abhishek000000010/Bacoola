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
      <div className="mb-7 flex flex-col items-center justify-center pb-4">
        <Heading
          level="h2"
          className="text-base font-bold uppercase tracking-[0.05em] text-[#111111] text-center"
        >
          Add Delivery Address
        </Heading>
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
          <SubmitButton
            className="mt-6 h-[50px] w-full rounded-none px-6 tracking-[0.05em]"
            data-testid="submit-address-button"
          >
            Confirm Address
          </SubmitButton>
          <p className="mt-4 text-center text-[12px] text-neutral-600">
            By continuing, you confirm you have read the <span className="font-semibold text-black">Privacy Policy</span>
          </p>
          <ErrorMessage error={message} data-testid="address-error-message" />
        </div>
      </form>
      <Divider className="mt-10 border-neutral-200" />
    </div>
  )
}

export default Addresses
