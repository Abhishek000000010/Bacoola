// @ts-nocheck
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Checkbox, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/config"

type Variant = {
  id: string
  title: string | null
  sku: string | null
}

/**
 * Bulk variant deletion for the product detail page.
 *
 * The stock admin only deletes variants one at a time from a row menu, which is
 * unworkable for the generated products here -- each carries 16 size/colour
 * variants that have to be cleared individually.
 *
 * At least one variant always has to survive: a product with none cannot be
 * priced, added to a cart, or published, so the UI refuses a full selection
 * rather than letting the admin break the product. The same rule is enforced in
 * the API middleware, since this widget is not the only way to delete a variant.
 */
const VariantBulkDelete = ({ data }: { data: { id: string } }) => {
  const productId = data?.id

  const [variants, setVariants] = useState<Variant[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await sdk.client.fetch(`/admin/products/${productId}`, {
        query: { fields: "id,variants.id,variants.title,variants.sku" },
      })
      setVariants(res?.product?.variants ?? [])
      setSelected(new Set())
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const remaining = variants.length - selected.size
  // Selecting everything is the one case that must never go through.
  const wouldDeleteAll = variants.length > 0 && remaining < 1

  const allSelectableChecked = useMemo(
    () => variants.length > 1 && selected.size === variants.length - 1,
    [variants, selected]
  )

  /** "Select all" deliberately stops one short, so the action stays valid. */
  const toggleAll = () => {
    if (allSelectableChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(variants.slice(0, -1).map((v) => v.id)))
    }
  }

  const onDelete = async () => {
    if (!selected.size || wouldDeleteAll) return

    if (
      !confirm(
        `Delete ${selected.size} variant${selected.size === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return
    }

    setDeleting(true)
    const failed: string[] = []

    // Sequential rather than parallel: the server rejects a delete that would
    // empty the product, and that check has to see each removal in turn.
    for (const id of selected) {
      try {
        await sdk.client.fetch(`/admin/products/${productId}/variants/${id}`, {
          method: "DELETE",
        })
      } catch (e: any) {
        failed.push(e?.message ?? id)
      }
    }

    setDeleting(false)

    if (failed.length) {
      toast.error(`${failed.length} variant(s) could not be deleted`, {
        description: failed[0],
      })
    } else {
      toast.success(`Deleted ${selected.size} variant(s)`)
    }

    await load()
  }

  if (!productId) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Bulk delete variants</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Select the variants to remove. At least one must remain.
          </Text>
        </div>
        <Button
          variant="danger"
          size="small"
          disabled={!selected.size || wouldDeleteAll || deleting}
          onClick={onDelete}
        >
          {deleting ? "Deleting..." : `Delete selected (${selected.size})`}
        </Button>
      </div>

      {loading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Loading variants...
          </Text>
        </div>
      ) : variants.length <= 1 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            This product has only one variant, so there is nothing to bulk delete.
          </Text>
        </div>
      ) : (
        <>
          {wouldDeleteAll && (
            <div className="px-6 py-2">
              <Text size="small" className="text-ui-fg-error">
                A product must keep at least one variant. Deselect one to continue.
              </Text>
            </div>
          )}
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-[48px]">
                  <Checkbox
                    checked={allSelectableChecked}
                    onCheckedChange={toggleAll}
                  />
                </Table.HeaderCell>
                <Table.HeaderCell>Variant</Table.HeaderCell>
                <Table.HeaderCell>SKU</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {variants.map((v) => (
                <Table.Row key={v.id}>
                  <Table.Cell>
                    <Checkbox
                      checked={selected.has(v.id)}
                      onCheckedChange={() => toggle(v.id)}
                    />
                  </Table.Cell>
                  <Table.Cell>{v.title || v.id}</Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">{v.sku || "-"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantBulkDelete
