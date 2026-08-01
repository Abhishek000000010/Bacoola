// @ts-nocheck
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Text, Checkbox, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { sdk } from "../lib/config"

/**
 * Care codes offered to the admin.
 *
 * MUST stay in sync with CARE_CODES in
 * apps/storefront/src/lib/util/product-details.ts -- the ids are what gets
 * stored, and the storefront resolves them to labels and symbols.
 */
const CARE_CODES = [
  { id: "wash_30", label: "Machine washing max 30°C" },
  { id: "wash_40", label: "Machine washing max 40°C" },
  { id: "hand_wash", label: "Hand wash only" },
  { id: "do_not_wash", label: "Do not wash" },
  { id: "do_not_bleach", label: "Do not bleach" },
  { id: "iron_110", label: "Ironing max 110°C" },
  { id: "iron_150", label: "Ironing max 150°C" },
  { id: "do_not_iron", label: "Do not iron" },
  { id: "dry_clean_p", label: "Dry cleaning perchloroethylene" },
  { id: "do_not_dry_clean", label: "Do not dry clean" },
  { id: "tumble_dry_low", label: "Tumble dry low" },
  { id: "do_not_tumble_dry", label: "Do not tumble dry" },
]

const ORIGIN_FIELDS = [
  { key: "designed_in", label: "Designed in" },
  { key: "manufacture", label: "Manufacture" },
  { key: "dye_printing", label: "Dye/printing" },
  { key: "weave", label: "Weave" },
]

/**
 * Per-product composition, origin and care.
 *
 * Feeds the "DETAILS, COMPOSITION AND CARE" panel on the product page. The
 * deliveries/returns half of that panel is store-wide policy and lives in the
 * storefront config, not here.
 *
 * Saved to `product.metadata.details`. The REF shown to shoppers falls back to
 * the existing `metadata.style_id` from the catalogue import, so it usually
 * needs no input.
 */
const ProductDetailsCare = ({ data }: { data: { id: string } }) => {
  const productId = data?.id

  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [composition, setComposition] = useState("")
  const [origin, setOrigin] = useState<Record<string, string>>({})
  const [care, setCare] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(`/admin/products/${productId}`, {
        query: { fields: "id,metadata" },
      })
      const md = res?.product?.metadata ?? {}
      setMetadata(md)

      const stored = typeof md.details === "string" ? safeParse(md.details) : md.details
      if (stored && typeof stored === "object") {
        // One composition line per row keeps the textarea simple to edit.
        setComposition((stored.composition ?? []).join("\n"))
        setCare(Array.isArray(stored.care) ? stored.care : [])
        const originMap: Record<string, string> = {}
        for (const entry of stored.origin ?? []) {
          const field = ORIGIN_FIELDS.find((f) => f.label === entry?.label)
          if (field) originMap[field.key] = entry.value
        }
        setOrigin(originMap)
      }
    } catch (e: any) {
      toast.error("Could not load product", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      load()
    }
  }, [productId])

  const onSave = async () => {
    setSaving(true)
    try {
      const compositionLines = composition
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

      const originEntries = ORIGIN_FIELDS.map((f) => ({
        label: f.label,
        value: (origin[f.key] ?? "").trim(),
      })).filter((o) => o.value !== "")

      const hasAny = compositionLines.length || originEntries.length || care.length

      await sdk.client.fetch(`/admin/products/${productId}`, {
        method: "POST",
        body: {
          metadata: {
            ...metadata,
            details: hasAny
              ? { composition: compositionLines, origin: originEntries, care }
              : null,
          },
        },
      })

      toast.success(hasAny ? "Details saved" : "Details cleared")
      await load()
    } catch (e: any) {
      toast.error("Could not save details", { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  if (!productId) return null

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Details, composition and care</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Shown in the DETAILS panel on the product page. Delivery and returns
          terms are store-wide and set in the storefront, not here.
        </Text>
      </div>

      {loading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      ) : (
        <>
          <div className="px-6 py-4">
            <Label size="small">Composition (one per line)</Label>
            <textarea
              className="bg-ui-bg-field border-ui-border-base mt-1 w-full rounded-md border p-2 text-sm"
              rows={3}
              placeholder="Composition: 67% lyocell, 33% linen"
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 px-6 py-4">
            {ORIGIN_FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <Label size="small">{f.label}</Label>
                <Input
                  className="w-56"
                  placeholder="—"
                  value={origin[f.key] ?? ""}
                  onChange={(e) =>
                    setOrigin((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="px-6 py-4">
            <Label size="small">Care</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CARE_CODES.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={care.includes(c.id)}
                    onCheckedChange={(checked: boolean) =>
                      setCare((prev) =>
                        checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                      )
                    }
                  />
                  <Text size="small">{c.label}</Text>
                </label>
              ))}
            </div>
          </div>

          <div className="px-6 py-4">
            <Button variant="primary" size="small" disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save details"}
            </Button>
          </div>
        </>
      )}
    </Container>
  )
}

const safeParse = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDetailsCare
