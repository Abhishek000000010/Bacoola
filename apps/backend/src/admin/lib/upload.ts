type UploadResponseFile = {
  id?: string
  url: string
  key?: string
}

type UploadOptions = {
  onProgress?: (progress: number) => void
}

export const uploadAdminFile = (
  file: File,
  { onProgress }: UploadOptions = {}
) => {
  return new Promise<UploadResponseFile>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("File uploads are only available in the browser"))
      return
    }

    const formData = new FormData()
    formData.append("files", file, file.name)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/admin/uploads")
    xhr.withCredentials = true

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return
      }

      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onerror = () => {
      reject(new Error("Failed to upload file"))
    }

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Failed to upload file"))
        return
      }

      try {
        const response = JSON.parse(xhr.responseText) as {
          files?: UploadResponseFile[]
        }

        const uploadedFile = response.files?.[0]

        if (!uploadedFile?.url) {
          reject(new Error("Upload response did not include a file URL"))
          return
        }

        resolve(uploadedFile)
      } catch {
        reject(new Error("Failed to parse upload response"))
      }
    }

    xhr.send(formData)
  })
}
