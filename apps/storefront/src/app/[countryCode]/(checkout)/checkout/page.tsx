import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import CheckoutSteps from "@modules/checkout/components/checkout-steps"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const [cart, customer] = await Promise.all([
    retrieveCart(),
    retrieveCustomer(),
  ])

  if (!cart) {
    return notFound()
  }

  return (
    <div className="content-container mx-auto pt-4 pb-8 small:pt-6 small:pb-12 max-w-[1024px]">
      <CheckoutSteps />
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-[6.5fr_3.5fr] lg:gap-x-16 small:gap-y-0 mt-8">
        <div className="w-full">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
        <div className="w-full small:max-w-[340px]">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
