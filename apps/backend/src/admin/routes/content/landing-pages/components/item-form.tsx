// @ts-nocheck
import { useState } from "react"
import { Drawer, Button, Input, Textarea, Label, Switch, Select, RadioGroup, toast } from "@medusajs/ui"
import { sdk } from "../../../../lib/config"
import { MediaUploadField } from "./media-upload-field"

type LandingSectionItem = {
  id?: string
  landing_section_id: string
  item_type: "card" | "slide" | "video" | "text" | "custom"
  title: string | null
  subtitle: string | null
  description: string | null
  desktop_image: string | null
  mobile_image: string | null
  video_url: string | null
  button_text: string | null
  button_link: string | null
  image_position: string
  alignment: "left" | "center" | "right"
  display_order: number
  is_visible: boolean
  metadata: Record<string, any> | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Partial<LandingSectionItem> | null
  sectionId: string
  onSuccess: () => void
}

export function ItemForm({ open, onOpenChange, item, sectionId, onSuccess }: Props) {
  const isEdit = !!item?.id
  const [loading, setLoading] = useState(false)

  const [itemType, setItemType] = useState(item?.item_type || "card")
  const [title, setTitle] = useState(item?.title || "")
  const [subtitle, setSubtitle] = useState(item?.subtitle || "")
  const [description, setDescription] = useState(item?.description || "")
  const [buttonText, setButtonText] = useState(item?.button_text || "")
  const [buttonLink, setButtonLink] = useState(item?.button_link || "")
  const [videoUrl, setVideoUrl] = useState(item?.video_url || "")
  const [alignment, setAlignment] = useState(item?.alignment || "center")
  const [displayOrder, setDisplayOrder] = useState(item?.display_order?.toString() || "0")
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true)
  const [imagePosition, setImagePosition] = useState(item?.image_position || "center center")
  const [metadataString, setMetadataString] = useState(item?.metadata ? JSON.stringify(item.metadata, null, 2) : "")

  const [desktopImage, setDesktopImage] = useState(item?.desktop_image || "")
  const [mobileImage, setMobileImage] = useState(item?.mobile_image || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let parsedMetadata = null
      if (metadataString.trim()) {
        try {
          parsedMetadata = JSON.parse(metadataString)
        } catch (err) {
          throw new Error("Metadata must be valid JSON")
        }
      }

      const payload = {
        item_type: itemType,
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        button_text: buttonText || null,
        button_link: buttonLink || null,
        video_url: videoUrl || null,
        alignment,
        display_order: parseInt(displayOrder, 10),
        is_visible: isVisible,
        metadata: parsedMetadata,
        desktop_image: desktopImage || null,
        mobile_image: mobileImage || null,
        image_position: imagePosition,
      }

      if (isEdit) {
        await sdk.client.fetch(`/admin/content/landing-pages/items/${item!.id}`, {
          method: "PUT",
          body: payload,
        })
        toast.success("Item updated successfully")
      } else {
        await sdk.client.fetch(`/admin/content/landing-pages/sections/${sectionId}/items`, {
          method: "POST",
          body: payload,
        })
        toast.success("Item created successfully")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-2xl">
        <Drawer.Header>
          <Drawer.Title>{isEdit ? "Edit Item" : "Add Item"}</Drawer.Title>
        </Drawer.Header>
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
          <Drawer.Body className="flex-1 overflow-y-auto flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label>Item Type</Label>
                  <Select value={itemType} onValueChange={(val: any) => setItemType(val)}>
                    <Select.Trigger><Select.Value /></Select.Trigger>
                    <Select.Content>
                      <Select.Item value="card">Card</Select.Item>
                      <Select.Item value="slide">Slide</Select.Item>
                      <Select.Item value="video">Video</Select.Item>
                      <Select.Item value="text">Text</Select.Item>
                      <Select.Item value="custom">Custom</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label>Display Order</Label>
                  <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} required />
                </div>
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="flex items-center gap-2 mt-4">
                    <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                    <Label>Visible</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Label className="text-ui-fg-base font-semibold">Text Content</Label>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Subtitle</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label>Button Text</Label>
                  <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label>Button Link</Label>
                  <Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Label className="text-ui-fg-base font-semibold">Media</Label>
              <div className="grid gap-4 lg:grid-cols-2">
                <MediaUploadField
                  label="Desktop Image Upload"
                  value={desktopImage}
                  onChange={setDesktopImage}
                  helperText="Uploads immediately to Cloudinary and stores only the URL."
                />
                <MediaUploadField
                  label="Mobile Image Upload"
                  value={mobileImage}
                  onChange={setMobileImage}
                  helperText="Optional. If omitted, the storefront keeps the existing local asset."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Image Position</Label>
                <Select value={imagePosition} onValueChange={(val: string) => setImagePosition(val)}>
                  <Select.Trigger><Select.Value /></Select.Trigger>
                  <Select.Content className="z-[999]">
                    <Select.Item value="center center">Center</Select.Item>
                    <Select.Item value="center top">Top</Select.Item>
                    <Select.Item value="center bottom">Bottom</Select.Item>
                    <Select.Item value="left center">Left</Select.Item>
                    <Select.Item value="right center">Right</Select.Item>
                    <Select.Item value="left top">Top Left</Select.Item>
                    <Select.Item value="right top">Top Right</Select.Item>
                    <Select.Item value="left bottom">Bottom Left</Select.Item>
                    <Select.Item value="right bottom">Bottom Right</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
                <Label>Video Upload (future support)</Label>
                <Input type="file" accept="video/*" disabled />
                <p className="text-xs text-ui-fg-subtle">
                  Placeholder for later. Use the Video URL field below for now.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Video URL</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Label className="text-ui-fg-base font-semibold">Layout</Label>
              <div className="flex flex-col gap-2">
                <Label>Alignment</Label>
                <RadioGroup value={alignment} onValueChange={(val: any) => setAlignment(val)}>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroup.Item value="left" id="align-left" />
                      <Label htmlFor="align-left">Left</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroup.Item value="center" id="align-center" />
                      <Label htmlFor="align-center">Center</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroup.Item value="right" id="align-right" />
                      <Label htmlFor="align-right">Right</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Label className="text-ui-fg-base font-semibold">Advanced</Label>
              <div className="flex flex-col gap-2">
                <Label>Metadata (JSON)</Label>
                <Textarea
                  value={metadataString}
                  onChange={(e) => setMetadataString(e.target.value)}
                  placeholder='{"overlay": true}'
                  className="font-mono text-xs"
                  rows={4}
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit" isLoading={loading}>{isEdit ? "Save" : "Add Item"}</Button>
            </div>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}
