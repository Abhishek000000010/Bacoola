"use client"

import { useId, useState } from "react"
import { Button } from "@medusajs/ui"
import { uploadAdminFile } from "../../../../lib/upload"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  helperText?: string
  accept?: string
}

export function MediaUploadField({
  label,
  value,
  onChange,
  helperText,
  accept = "image/*",
}: Props) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      const uploadedFile = await uploadAdminFile(file, {
        onProgress: setProgress,
      })

      onChange(uploadedFile.url)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      )
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleClear = () => {
    onChange("")
    setError(null)
    setProgress(0)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="text-sm font-medium text-ui-fg-base">
            {label}
          </label>
          {helperText && <p className="text-xs text-ui-fg-subtle">{helperText}</p>}
        </div>

        {value && !uploading && (
          <Button size="small" variant="secondary" type="button" onClick={handleClear}>
            Remove
          </Button>
        )}
      </div>

      <label
        htmlFor={inputId}
        className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-ui-border-base bg-ui-bg-subtle transition-colors hover:border-ui-fg-base"
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="text-sm font-medium text-ui-fg-base">Choose file</span>
            <span className="text-xs text-ui-fg-subtle">
              Uploads immediately and stores only the Cloudinary URL.
            </span>
          </div>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading && (
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ui-bg-subtle">
            <div
              className="h-full bg-ui-fg-base transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-ui-fg-subtle">{progress}% uploaded</p>
        </div>
      )}

      {error && <p className="text-xs text-ui-fg-error">{error}</p>}
    </div>
  )
}
