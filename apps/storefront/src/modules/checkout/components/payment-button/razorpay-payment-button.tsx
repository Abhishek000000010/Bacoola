"use client"

import { Button } from "@modules/common/components/ui"
import React, { useCallback, useEffect, useState } from "react"
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay"
import { HttpTypes } from "@medusajs/types"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "../error-message"

export const RazorpayPaymentButton = ({
  session,
  notReady,
  cart,
  "data-testid": dataTestId,
}: {
  session: HttpTypes.StorePaymentSession
  notReady: boolean
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { Razorpay } = useRazorpay()

  const orderData = session.data as { id: string }

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message || "An error occurred, please try again.")
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = useCallback(async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!orderData?.id) {
      setErrorMessage("No order session found. Please try again.")
      setSubmitting(false)
      return
    }

    const options: RazorpayOrderOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_T6Dp9BJO5sSWlW",
      amount: session.amount,
      order_id: orderData.id,
      currency: cart.currency_code.toUpperCase() as any,
      name: process.env.NEXT_PUBLIC_SHOP_NAME || "Bacoola",
      description: `Order ${orderData.id}`,
      remember_customer: true,
      modal: {
        backdropclose: true,
        escape: true,
        handleback: true,
        confirm_close: true,
        ondismiss: () => {
          setSubmitting(false)
          setErrorMessage("Payment cancelled by user")
        },
      },
      handler: async (response: any) => {
        onPaymentCompleted()
      },
      prefill: {
        name: `${cart.billing_address?.first_name || ""} ${cart.billing_address?.last_name || ""}`.trim(),
        email: cart.email || "",
        contact: cart.billing_address?.phone || cart.shipping_address?.phone || "",
      },
    }

    try {
      const razorpay = new Razorpay(options)
      razorpay.open()
      razorpay.on("payment.failed", function (response: any) {
        setErrorMessage(response.error?.description || "Payment failed")
        setSubmitting(false)
      })
    } catch (err: any) {
      setErrorMessage(err.message || "Could not load Razorpay SDK")
      setSubmitting(false)
    }
  }, [Razorpay, cart, session, orderData])

  return (
    <>
      <Button
        disabled={notReady || submitting || !orderData?.id}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="razorpay-payment-error-message"
      />
    </>
  )
}
