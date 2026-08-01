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

/** Matches "color", "Colour", "COLOR" -- spelling is inconsistent across products. */
const isColourOption = (option: any): boolean =>
  /^colou?rs?$/i.test((option?.title ?? "").trim())

const colourValueOf = (variant: any, colourOptionId?: string): string | undefined => {
  if (!colourOptionId) return undefined
  return (variant?.options ?? []).find((o: any) => o.option_id === colourOptionId)?.value
}

/**
 * Per-COLOUR image selection and ordering for the variant detail page.
 *
 * Medusa has no real variant->image relation: a variant's `images` resolves to
 * the whole product gallery, and there is no native way to say "these photos
 * belong to this colourway". So the selection is owned here, stored on the
 * variant as `metadata.image_order` -- an ordered list of image ids that is BOTH
 * the selection (only listed images show) and the order (the sequence they show
 * in). The storefront reads the same list.
 *
 * Selection is per COLOUR, not per variant: a shirt in red/S..red/XL shares one
 * set of photos, so saving writes the same list to every variant of the same
 * colour. Products without a colour option fall back to just this one variant.
 *
 * An empty list means "not curated" -- the storefront then falls back to the
 * full product gallery, so nothing breaks for products that were never touched.
 */
const VariantImageOrder = ({ data }: { data?: { id?: string; product_id?: string } }) => {
  const params = useParams()
  const productId = (params.id as string) || data?.product_id
  const variantId = (params.variant_id as string) || data?.id

  const [images, setImages] = useState<Image[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [savedOrder, setSavedOrder] = useState<string[]>([])
  const [colourLabel, setColourLabel] = useState<string | undefined>()
  // Every variant this save will write to, with its current metadata to merge.
  const [targets, setTargets] = useState<{ id: string; metadata: Record<string, any> }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // The product-image pool stays hidden until the admin chooses to add more, so
  // the widget shows only THIS colour's images by default.
  const [adding, setAdding] = useState(false)

  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(`/admin/products/${productId}`, {
        query: {
          fields:
            "id,images.id,images.url," +
            "options.id,options.title," +
            "variants.id,variants.title,variants.metadata," +
            "variants.options.option_id,variants.options.value",
        },
      })
      const product = res?.product ?? {}
      const imgs: Image[] = (product.images ?? []).map((i: any) => ({ id: i.id, url: i.url }))
      setImages(imgs)

      const variants: any[] = product.variants ?? []
      const current = variants.find((v) => v.id === variantId)
      const colourOption = (product.options ?? []).find(isColourOption)
      const currentColour = colourValueOf(current, colourOption?.id)
      setColourLabel(currentColour)

      // Which variants this save applies to: every variant of the same colour,
      // or just this one if there is no colour option / value.
      const sameColour =
        colourOption && currentColour
          ? variants.filter((v) => colourValueOf(v, colourOption.id) === currentColour)
          : [current].filter(Boolean)
      setTargets(sameColour.map((v) => ({ id: v.id, metadata: v.metadata ?? {} })))

      // Seed the selection/order from this variant's saved list, dropping ids of
      // images that no longer exist on the product.
      const present = new Set(imgs.map((i) => i.id))
      const saved: string[] = Array.isArray(current?.metadata?.image_order)
        ? current.metadata.image_order.filter((id: string) => present.has(id))
        : []
      setOrder(saved)
      setSavedOrder(saved)
    } catch (e: any) {
      toast.error("Could not load product images", { description: e?.message })
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

  const selectedSet = useMemo(() => new Set(order), [order])
  const available = useMemo(
    () => images.filter((img) => !selectedSet.has(img.id)),
    [images, selectedSet]
  )

  const isDirty = useMemo(
    () => order.length !== savedOrder.length || order.some((id, i) => id !== savedOrder[i]),
    [order, savedOrder]
  )

  const add = (id: string) => setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]))
  const remove = (id: string) => setOrder((prev) => prev.filter((x) => x !== id))

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
    if (!targets.length) return
    setSaving(true)
    const failed: string[] = []

    for (const target of targets) {
      try {
        await sdk.client.fetch(`/admin/products/${productId}/variants/${target.id}`, {
          method: "POST",
          body: { metadata: { ...target.metadata, image_order: order } },
        })
      } catch (e: any) {
        failed.push(e?.message ?? target.id)
      }
    }

    setSaving(false)

    if (failed.length) {
      toast.error(`${failed.length} variant(s) could not be saved`, { description: failed[0] })
    } else {
      setSavedOrder(order)
      // Reflect the write locally so a subsequent save merges cleanly.
      setTargets((prev) =>
        prev.map((t) => ({ ...t, metadata: { ...t.metadata, image_order: order } }))
      )
      const scope = colourLabel ? `all "${colourLabel}" variants` : "this variant"
      toast.success(`Saved images for ${scope} (${targets.length})`)
    }
  }

  if (!productId || !variantId) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Images for this colour</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {colourLabel
              ? `Pick which product images show for "${colourLabel}" and drag to order them. Saved to every "${colourLabel}" variant.`
              : `Pick which product images show for this variant and drag to order them.`}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          {!loading && available.length > 0 && (
            <Button variant="secondary" size="small" onClick={() => setAdding((a) => !a)}>
              {adding ? "Done adding" : `+ Add images (${available.length})`}
            </Button>
          )}
          {isDirty && (
            <Button variant="secondary" size="small" disabled={saving} onClick={() => setOrder(savedOrder)}>
              Reset
            </Button>
          )}
          <Button size="small" disabled={!isDirty || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Selected images -- draggable order */}
      <div className="px-6 py-4">
        <Text size="small" weight="plus" className="mb-2">
          Selected ({order.length}){" "}
          <span className="text-ui-fg-subtle font-normal">— drag to order</span>
        </Text>
        {loading ? (
          <Text size="small" className="text-ui-fg-subtle">Loading images...</Text>
        ) : order.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No images selected. This colourway will fall back to the full product gallery.
            Click <strong>+ Add images</strong> above to choose which images belong to it.
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
                  onDragStart={() => { dragIndex.current = index }}
                  onDragEnter={() => setOverIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => { dragIndex.current = null; setOverIndex(null) }}
                  className={
                    "group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-ui-bg-subtle-hover shadow-elevation-card-rest transition-fg active:cursor-grabbing " +
                    (isOver ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base")
                  }
                >
                  <div className="absolute left-2 top-2 z-10">
                    <Badge size="2xsmall">{index + 1}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="absolute right-1 top-1 z-10 rounded-full bg-ui-bg-base/80 px-1.5 text-ui-fg-subtle opacity-0 transition-opacity hover:text-ui-fg-base group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                  <img src={img.url} draggable={false} className="size-full object-cover object-center" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Available images -- hidden until the admin opts to add more */}
      {!loading && adding && available.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" className="mb-2">
            Add images{" "}
            <span className="text-ui-fg-subtle font-normal">— click to add to this colour</span>
          </Text>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {available.map((img) => (
              <button
                type="button"
                key={img.id}
                onClick={() => add(img.id)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle-hover opacity-70 transition-fg hover:opacity-100 hover:border-ui-border-interactive"
              >
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-ui-bg-base/0 text-2xl font-light text-ui-fg-on-color opacity-0 transition-opacity group-hover:bg-ui-bg-base/30 group-hover:opacity-100">
                  +
                </div>
                <img src={img.url} draggable={false} className="size-full object-cover object-center" />
              </button>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default VariantImageOrder
