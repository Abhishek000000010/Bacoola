// @ts-nocheck
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, Badge, toast } from "@medusajs/ui"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { sdk } from "../lib/config"

type Image = {
  id: string
  url: string
}

/**
 * Per-variant image ordering for the variant detail page.
 *
 * The stock variant Media screen only adds/removes images; it stores no order,
 * so the grid -- and the storefront gallery -- always follows the product-level
 * image order. That makes it impossible to say "for this colourway, show this
 * photo first". This widget lets the admin drag the variant's assigned images
 * into the sequence they want, and persists that sequence on the variant as
 * `metadata.image_order` (an ordered list of image ids).
 *
 * The storefront reads that list and sorts the variant's gallery by it. Images
 * added after an order was saved (not yet in the list) are appended at the end,
 * so the order never has to be rebuilt from scratch when a photo is added.
 */
const VariantImageOrder = ({ data }: { data?: { id?: string; product_id?: string } }) => {
  // Prefer the route params so the widget doesn't depend on the injected data
  // shape, but fall back to `data` if params are somehow unavailable.
  const params = useParams()
  const productId = (params.id as string) || data?.product_id
  const variantId = (params.variant_id as string) || data?.id

  const [images, setImages] = useState<Image[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [savedOrder, setSavedOrder] = useState<string[]>([])
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Index of the tile currently being dragged, and the tile it's hovering over,
  // so we can show where it will land.
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(
        `/admin/products/${productId}/variants/${variantId}`,
        { query: { fields: "id,metadata,thumbnail,images.id,images.url" } }
      )
      const variant = res?.variant ?? {}
      const imgs: Image[] = (variant.images ?? []).map((i: any) => ({ id: i.id, url: i.url }))
      const meta = variant.metadata ?? {}
      const saved: string[] = Array.isArray(meta.image_order) ? meta.image_order : []

      setImages(imgs)
      setMetadata(meta)

      // Start from the saved order (keeping only ids that still exist), then
      // append any images that aren't in it yet.
      const present = new Set(imgs.map((i) => i.id))
      const ordered = saved.filter((id) => present.has(id))
      for (const img of imgs) {
        if (!ordered.includes(img.id)) ordered.push(img.id)
      }
      setOrder(ordered)
      setSavedOrder(ordered)
    } catch (e: any) {
      toast.error("Could not load variant images", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId && variantId) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, variantId])

  const imageById = useMemo(() => {
    const m = new Map<string, Image>()
    for (const img of images) m.set(img.id, img)
    return m
  }, [images])

  const isDirty = useMemo(
    () => order.length !== savedOrder.length || order.some((id, i) => id !== savedOrder[i]),
    [order, savedOrder]
  )

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const onDrop = (to: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    setOverIndex(null)
    if (from === null) return
    move(from, to)
  }

  const onSave = async () => {
    setSaving(true)
    try {
      await sdk.client.fetch(`/admin/products/${productId}/variants/${variantId}`, {
        method: "POST",
        body: { metadata: { ...metadata, image_order: order } },
      })
      setSavedOrder(order)
      setMetadata((m) => ({ ...m, image_order: order }))
      toast.success("Image order saved")
    } catch (e: any) {
      toast.error("Could not save image order", { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  if (!productId || !variantId) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Image order</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Drag to arrange how this variant&apos;s images appear on the storefront.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          {isDirty && (
            <Button
              variant="secondary"
              size="small"
              disabled={saving}
              onClick={() => setOrder(savedOrder)}
            >
              Reset
            </Button>
          )}
          <Button size="small" disabled={!isDirty || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save order"}
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <Text size="small" className="text-ui-fg-subtle">
            Loading images...
          </Text>
        ) : order.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            This variant has no images yet. Add images from the Media section above,
            then come back here to arrange them.
          </Text>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {order.map((id, index) => {
              const img = imageById.get(id)
              if (!img) return null
              const isOver = overIndex === index
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => {
                    dragIndex.current = index
                  }}
                  onDragEnter={() => setOverIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => {
                    dragIndex.current = null
                    setOverIndex(null)
                  }}
                  className={
                    "group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-ui-bg-subtle-hover shadow-elevation-card-rest transition-fg active:cursor-grabbing " +
                    (isOver ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base")
                  }
                >
                  <div className="absolute left-2 top-2 z-10">
                    <Badge size="2xsmall">{index + 1}</Badge>
                  </div>
                  <img
                    src={img.url}
                    draggable={false}
                    className="size-full object-cover object-center"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default VariantImageOrder
