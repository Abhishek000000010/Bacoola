import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import crypto from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_webhook_secret"
  const signature = req.headers["x-razorpay-signature"] as string

  if (!signature) {
    return res.status(400).json({ error: "Missing Razorpay signature" })
  }

  const rawBody = req.rawBody?.toString() || JSON.stringify(req.body)
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (signature !== expectedSignature) {
    // Note: If req.rawBody isn't available, JSON.stringify(req.body) might not 
    // exactly match the original string format Razorpay sent, causing signature failure.
    // Medusa automatically populates req.rawBody if configured, otherwise we fallback.
    return res.status(400).json({ error: "Invalid signature" })
  }

  const event = req.body?.event
  if (event === "payment.captured" || event === "payment.authorized" || event === "order.paid") {
    
    // Extract the cart_id from the Razorpay order notes
    const paymentEntity = req.body?.payload?.payment?.entity
    const orderEntity = req.body?.payload?.order?.entity
    
    const cartId = paymentEntity?.notes?.cart_id || orderEntity?.notes?.cart_id
    
    if (!cartId) {
      req.scope.resolve("logger").warn(`[Razorpay Webhook] Received ${event} but no cart_id found in notes.`)
      return res.status(200).json({ received: true, msg: "No cart_id found" })
    }

    req.scope.resolve("logger").info(`[Razorpay Webhook] Processing ${event} for cart: ${cartId}`)

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Check if the cart is already completed
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "completed_at"],
      filters: { id: cartId }
    }).catch(() => ({ data: [] }))
    
    if (carts && carts.length > 0 && carts[0].completed_at) {
      req.scope.resolve("logger").info(`[Razorpay Webhook] Cart ${cartId} already completed. Skipping.`)
      return res.status(200).json({ received: true, status: "Cart already completed" })
    }

    try {
      // Force completion of the cart so it generates an Order
      const { result } = await completeCartWorkflow(req.scope).run({
        input: { id: cartId }
      })
      req.scope.resolve("logger").info(`[Razorpay Webhook] Successfully completed cart ${cartId} into order.`)
    } catch (err: any) {
      req.scope.resolve("logger").error(`[Razorpay Webhook] Error completing cart ${cartId}: ${err.message}`)
      // Even if it fails (e.g. already completed by browser concurrently), we return 200 so Razorpay doesn't retry infinitely
    }

    return res.status(200).json({ received: true })
  }

  // Acknowledge other events so Razorpay doesn't retry
  return res.status(200).json({ received: true })
}
