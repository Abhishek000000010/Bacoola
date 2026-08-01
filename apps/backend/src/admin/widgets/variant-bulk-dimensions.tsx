// @ts-nocheck
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/config"

type Variant = {
  id: string
  title: string | null
  sku: string | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
}

const FIELDS = ["weight", "length", "width", "height"] as const
type Field = (typeof FIELDS)[number]

/**
 * Bulk shipping-dimension editor for the product detail page.
 *
 * The stock admin has bulk editors for prices and stock levels but none for
 * weight/length/width/height -- those can only be set one variant at a time,
 * which is painful for the size x colour matrices here (a product with 15
 * variants means typing the same four numbers 15 times). For clothing every
 * variant of a product almost always ships with identical dimensions, so this
 * lets the admin enter them once and apply to every variant.
 *
 * Publishing requires all four on every VARIANT (product-level values are
 * ignored for shipping), so filling them here is what unblocks publish.
 */
const VariantBulkDimensions = ({ data }: { data: { id: string } }) => {
  const productId = data?.id

  const [variants, setVariants] = useState<Variant[]>([])
  const [values, setValues] = useState<Record<Field, string>>({
    weight: "",
    length: "",
    width: "",
    height: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(`/admin/products/${productId}`, {
        query: {
          fields:
            "id,variants.id,variants.title,variants.sku,variants.weight,variants.length,variants.width,variants.height",
        },
      })
      const loaded: Variant[] = res?.product?.variants ?? []
      setVariants(loaded)

      // Prefill the form when every variant already shares the same value for a
      // field, so re-applying or tweaking one number is easy.
      const shared = (f: Field): string => {
        const first = loaded[0]?.[f]
        if (first === null || first === undefined) return ""
        return loaded.every((v) => v[f] === first) ? String(first) : ""
      }
      setValues({
        weight: shared("weight"),
        length: shared("length"),
        width: shared("width"),
        height: shared("height"),
      })
    } catch (e: any) {
      toast.error("Could not load variants", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      load()
    }
  }, [productId])

  const parsed = useMemo(() => {
    const out: Partial<Record<Field, number>> = {}
    for (const f of FIELDS) {
      const raw = values[f].trim()
      if (raw === "") continue
      const n = Number(raw)
      if (Number.isFinite(n) && n > 0) out[f] = n
    }
    return out
  }, [values])

  // Only fields the admin actually filled are applied, so a partial update
  // (e.g. just weight) leaves the other stored dimensions untouched.
  const hasSomething = Object.keys(parsed).length > 0
  const anyInvalid = FIELDS.some((f) => {
    const raw = values[f].trim()
    return raw !== "" && !(Number.isFinite(Number(raw)) && Number(raw) > 0)
  })

  const onApply = async () => {
    if (!variants.length || !hasSomething) return

    setSaving(true)
    const failed: string[] = []

    // Sequential: the API guard that requires dimensions on published variants
    // inspects each update in turn, and the variant count here is small.
    for (const v of variants) {
      try {
        await sdk.client.fetch(`/admin/products/${productId}/variants/${v.id}`, {
          method: "POST",
          body: parsed,
        })
      } catch (e: any) {
        failed.push(`${v.title || v.id}: ${e?.message ?? "failed"}`)
      }
    }

    setSaving(false)

    if (failed.length) {
      toast.error(`${failed.length} variant(s) could not be updated`, {
        description: failed[0],
      })
    } else {
      toast.success(`Applied dimensions to ${variants.length} variant(s)`)
    }

    await load()
  }

  if (!productId) return null

  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined ? "-" : String(n)

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Set shipping dimensions for all variants</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Enter the values once and apply them to every variant. Leave a field
          blank to keep each variant's current value. Required on every variant
          before the product can be published.
        </Text>
      </div>

      <div className="flex flex-wrap items-end gap-4 px-6 py-4">
        {FIELDS.map((f) => (
          <div key={f} className="flex flex-col gap-1">
            <Label size="small" className="capitalize">
              {f}
            </Label>
            <Input
              type="number"
              min="0"
              step="any"
              className="w-28"
              value={values[f]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f]: e.target.value }))
              }
              placeholder="—"
            />
          </div>
        ))}
        <Button
          variant="primary"
          size="small"
          disabled={!hasSomething || anyInvalid || saving || !variants.length}
          onClick={onApply}
        >
          {saving ? "Applying..." : "Apply to all variants"}
        </Button>
      </div>

      {anyInvalid && (
        <div className="px-6 py-2">
          <Text size="small" className="text-ui-fg-error">
            Dimensions must be numbers greater than 0.
          </Text>
        </div>
      )}

      {loading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Loading variants...
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Weight</Table.HeaderCell>
              <Table.HeaderCell>Length</Table.HeaderCell>
              <Table.HeaderCell>Width</Table.HeaderCell>
              <Table.HeaderCell>Height</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {variants.map((v) => (
              <Table.Row key={v.id}>
                <Table.Cell>{v.title || v.id}</Table.Cell>
                <Table.Cell>{fmt(v.weight)}</Table.Cell>
                <Table.Cell>{fmt(v.length)}</Table.Cell>
                <Table.Cell>{fmt(v.width)}</Table.Cell>
                <Table.Cell>{fmt(v.height)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantBulkDimensions
