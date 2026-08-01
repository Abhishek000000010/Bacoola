// @ts-nocheck
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/config"

/**
 * Measurement rows per garment type.
 *
 * MUST stay in sync with apps/storefront/src/lib/util/measurements.ts, which
 * owns the storefront half (labels, how-to-measure copy, size equivalents). Keys
 * are what gets stored, so renaming one here orphans saved numbers.
 */
const GARMENT_TYPES = [
  {
    id: "top",
    label: "Top / T-shirt / Shirt",
    article: ["length", "back", "chest", "sleeve_width", "sleeve_length"],
    body: ["bust", "waist"],
  },
  {
    id: "bottom",
    label: "Trousers / Jeans / Shorts",
    article: ["waist", "hip", "inseam", "outseam", "leg_opening"],
    body: ["waist", "hip"],
  },
  {
    id: "dress",
    label: "Dress / Skirt",
    article: ["length", "chest", "waist", "sleeve_length"],
    body: ["bust", "waist", "hip"],
  },
]

const LABELS = {
  length: "Length",
  back: "Back",
  chest: "Chest",
  sleeve_width: "Sleeve width",
  sleeve_length: "Sleeve length",
  waist: "Waist",
  hip: "Hip",
  inseam: "Inside leg",
  outseam: "Outside leg",
  leg_opening: "Leg opening",
  bust: "Bust",
}

/**
 * Per-product measurement editor.
 *
 * Measurements differ BY SIZE by definition -- an S chest is not an XL chest --
 * so unlike the shipping-dimension widget this is a grid, one column per size,
 * not a single value applied to everything. What is constant is colour: every
 * colourway of a given size shares that size's numbers, which is why this lives
 * on the product and not on individual variants.
 *
 * Values are entered and stored in CENTIMETRES; the storefront converts for its
 * CM/IN toggle. Saved to `product.metadata.measurements`.
 */
const ProductMeasurements = ({ data }: { data: { id: string } }) => {
  const productId = data?.id

  const [sizes, setSizes] = useState<string[]>([])
  const [garmentType, setGarmentType] = useState("top")
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  // "article.chest.S" -> "52"
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const garment = useMemo(
    () => GARMENT_TYPES.find((g) => g.id === garmentType) ?? GARMENT_TYPES[0],
    [garmentType]
  )

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(`/admin/products/${productId}`, {
        query: { fields: "id,metadata,options.id,options.title,options.values.value" },
      })
      const product = res?.product ?? {}

      // Sizes come from the product's own Size option, so the grid can never
      // offer a size the product doesn't actually sell.
      const sizeOption = (product.options ?? []).find((o: any) =>
        /^sizes?$/i.test((o.title ?? "").trim())
      )
      const loadedSizes: string[] = [
        ...new Set(
          (sizeOption?.values ?? [])
            .map((v: any) => (typeof v === "string" ? v : v?.value))
            .filter(Boolean)
        ),
      ]
      setSizes(loadedSizes)
      setMetadata(product.metadata ?? {})

      const stored = product.metadata?.measurements
      const parsed = typeof stored === "string" ? safeParse(stored) : stored
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.garment_type === "string") setGarmentType(parsed.garment_type)
        const next: Record<string, string> = {}
        for (const section of ["article", "body"]) {
          const table = parsed[section]
          if (!table || typeof table !== "object") continue
          for (const [row, bySize] of Object.entries<any>(table)) {
            if (!bySize || typeof bySize !== "object") continue
            for (const [size, value] of Object.entries<any>(bySize)) {
              if (value !== null && value !== undefined && value !== "") {
                next[`${section}.${row}.${size}`] = String(value)
              }
            }
          }
        }
        setValues(next)
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

  const anyInvalid = Object.values(values).some(
    (raw) => raw.trim() !== "" && !(Number.isFinite(Number(raw)) && Number(raw) > 0)
  )

  const onSave = async () => {
    setSaving(true)
    try {
      // Only cells the admin actually filled are written, so an empty row simply
      // doesn't render on the storefront rather than showing zeros.
      const build = (section: "article" | "body") => {
        const table: Record<string, Record<string, number>> = {}
        for (const row of garment[section]) {
          const bySize: Record<string, number> = {}
          for (const size of sizes) {
            const raw = (values[`${section}.${row}.${size}`] ?? "").trim()
            if (raw === "") continue
            const n = Number(raw)
            if (Number.isFinite(n) && n > 0) bySize[size] = n
          }
          if (Object.keys(bySize).length) table[row] = bySize
        }
        return table
      }

      const article = build("article")
      const body = build("body")
      const hasAny = Object.keys(article).length || Object.keys(body).length

      await sdk.client.fetch(`/admin/products/${productId}`, {
        method: "POST",
        body: {
          // Spread the existing metadata so unrelated keys survive the write.
          metadata: {
            ...metadata,
            measurements: hasAny
              ? { unit: "cm", garment_type: garmentType, sizes, article, body }
              : null,
          },
        },
      })

      toast.success(
        hasAny ? "Measurements saved" : "Measurements cleared"
      )
      await load()
    } catch (e: any) {
      toast.error("Could not save measurements", { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  if (!productId) return null

  const cell = (section: "article" | "body", row: string, size: string) => {
    const key = `${section}.${row}.${size}`
    return (
      <td key={key} className="px-2 py-1">
        <Input
          type="number"
          min="0"
          step="any"
          className="w-24"
          placeholder="—"
          value={values[key] ?? ""}
          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
        />
      </td>
    )
  }

  const grid = (section: "article" | "body", title: string, hint: string) => (
    <div className="px-6 py-4">
      <Heading level="h3">{title}</Heading>
      <Text size="small" className="text-ui-fg-subtle mb-3">
        {hint}
      </Text>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">
                <Label size="small">Measurement (cm)</Label>
              </th>
              {sizes.map((size) => (
                <th key={size} className="px-2 py-1 text-left">
                  <Label size="small">{size}</Label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {garment[section].map((row) => (
              <tr key={row}>
                <td className="px-2 py-1">
                  <Text size="small">{LABELS[row] ?? row}</Text>
                </td>
                {sizes.map((size) => cell(section, row, size))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Measurements</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Shown to shoppers in the MEASUREMENTS panel on the product page. Enter
          centimetres; the storefront converts to inches. Leave a cell blank to
          hide it. Colourways share these numbers -- only size changes them.
        </Text>
      </div>

      <div className="flex items-end gap-4 px-6 py-4">
        <div className="flex flex-col gap-1">
          <Label size="small">Garment type</Label>
          <select
            className="bg-ui-bg-field border-ui-border-base h-8 rounded-md border px-2 text-sm"
            value={garmentType}
            onChange={(e) => setGarmentType(e.target.value)}
          >
            {GARMENT_TYPES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          size="small"
          disabled={saving || loading || anyInvalid || !sizes.length}
          onClick={onSave}
        >
          {saving ? "Saving..." : "Save measurements"}
        </Button>
        {anyInvalid && (
          <Text size="small" className="text-ui-fg-error">
            Measurements must be numbers greater than 0.
          </Text>
        )}
      </div>

      {loading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      ) : !sizes.length ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            This product has no "Size" option, so there is nothing to measure
            against. Add a Size option first.
          </Text>
        </div>
      ) : (
        <>
          {grid(
            "article",
            "Article",
            "The garment laid flat."
          )}
          {grid(
            "body",
            "Body",
            "The body this size is designed to fit. Optional."
          )}
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

export default ProductMeasurements
