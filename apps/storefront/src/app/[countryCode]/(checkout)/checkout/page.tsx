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
    <div className="content-container mx-auto pt-4 pb-12 max-w-[480px]">
      <CheckoutSteps />
      
      <div className="flex flex-col gap-y-6 mt-8">
        <div className="w-full">
          <CheckoutSummary cart={cart} />
        </div>

        <div className="w-full">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
      </div>
    </div>
  )
}
