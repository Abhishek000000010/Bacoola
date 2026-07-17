// @ts-nocheck
import { Table, Badge, IconButton } from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"

type Section = {
  id: string
  section_key: string
  title: string | null
  display_order: number
  is_visible: boolean
}

type Props = {
  sections: Section[]
  onEdit: (section: Section) => void
  onDelete: (id: string) => void
}

export function SectionTable({ sections, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Order</Table.HeaderCell>
          <Table.HeaderCell>Section Key</Table.HeaderCell>
          <Table.HeaderCell>Title</Table.HeaderCell>
          <Table.HeaderCell>Visibility</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sections.map((section) => (
          <Table.Row key={section.id}>
            <Table.Cell>{section.display_order}</Table.Cell>
            <Table.Cell>{section.section_key}</Table.Cell>
            <Table.Cell>{section.title || "-"}</Table.Cell>
            <Table.Cell>
              <Badge color={section.is_visible ? "green" : "grey"}>
                {section.is_visible ? "Visible" : "Hidden"}
              </Badge>
            </Table.Cell>
            <Table.Cell className="text-right">
              <div className="flex justify-end gap-2">
                <IconButton 
                  variant="transparent" 
                  size="small" 
                  onClick={() => onEdit(section)}
                >
                  <PencilSquare />
                </IconButton>
                <IconButton 
                  variant="transparent" 
                  size="small" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this section?")) {
                      onDelete(section.id)
                    }
                  }}
                >
                  <Trash className="text-ui-fg-error" />
                </IconButton>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
