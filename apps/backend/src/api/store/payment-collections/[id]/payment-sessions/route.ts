import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Override of the core "initiate payment session" store route.
 *
 * Why this exists: the Razorpay provider (@sgftech/payment-razorpay) needs the
 * cart at `context.extra` to create the Razorpay order. The core route only
 * forwards `provider_id`/`data` and never puts the cart into the provider
 * context, and the store API schema rejects a client-supplied `context`.
 *
 * So the storefront sends the cart id in `data.cart_id`, and here we fetch the
 * cart server-side and pass it to the workflow as `context.extra`. This is a
 * no-op for providers that ignore `context.extra` (manual, Stripe).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const collectionId = req.params.id
  const { provider_id, data } = (req.body ?? {}) as {
    provider_id: string
    data?: Record<string, unknown> & { cart_id?: string }
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let cart: unknown = undefined
  let cartCustomerId: string | undefined = undefined
  const cartId = data?.cart_id

  if (cartId) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "region_id",
        "customer_id",
        "customer.*",
        "billing_address.*",
        "shipping_address.*",
        "items.*",
        "metadata",
      ],
      filters: { id: cartId as string },
    })
    const rawCart = carts?.[0] as any
    if (rawCart) {
      if (!rawCart.customer) {
        rawCart.customer = {
          email: rawCart.email,
          first_name: rawCart.billing_address?.first_name || rawCart.shipping_address?.first_name || "Guest",
          last_name: rawCart.billing_address?.last_name || rawCart.shipping_address?.last_name || "Customer",
          phone: rawCart.billing_address?.phone || rawCart.shipping_address?.phone || "",
          addresses: [],
          metadata: {},
        }
      }
      cart = rawCart
      cartCustomerId = rawCart.customer_id
    }
  }

  await createPaymentSessionsWorkflow(req.scope).run({
    input: {
      payment_collection_id: collectionId,
      provider_id,
      // Fall back to the cart's customer for guest checkouts so the provider
      // always receives customer details (Razorpay needs a phone number).
      customer_id: req.auth_context?.actor_id ?? cartCustomerId,
      data,
      context: { extra: cart } as Record<string, unknown>,
    },
  })

  const {
    data: [payment_collection],
  } = await query.graph({
    entity: "payment_collection",
    fields: [
      "id",
      "status",
      "amount",
      "currency_code",
      "payment_sessions.*",
    ],
    filters: { id: collectionId },
  })

  res.status(200).json({ payment_collection })
}
