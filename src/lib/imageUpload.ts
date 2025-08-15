import { useState } from "react"

const IMGBB_API_KEY = "cbe92f988094f959cf6091a9a84ff6ed"
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload"

export interface ImageUploadResult {
  url: string
  deleteUrl?: string
  filename: string
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ImageUploadError"
  }
}

export const uploadToImgBB = async (file: File): Promise<ImageUploadResult> => {
  // Validate file
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("Only image files are allowed")
  }

  // Check file size (ImgBB free tier allows up to 32MB)
  const maxSize = 32 * 1024 * 1024 // 32MB
  if (file.size > maxSize) {
    throw new ImageUploadError("Image must be smaller than 32MB")
  }

  try {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("key", IMGBB_API_KEY)

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new ImageUploadError(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new ImageUploadError(result.error?.message || "Upload failed")
    }

    return {
      url: result.data.url,
      deleteUrl: result.data.delete_url,
      filename: result.data.image.filename,
    }
  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw error
    }
    throw new ImageUploadError("Network error during upload")
  }
}

export const deleteFromImgBB = async (deleteUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(deleteUrl, {
      method: "DELETE",
    })
    return response.ok
  } catch (error) {
    console.error("Failed to delete image:", error)
    return false
  }
}

// Hook for image upload with preview
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setPreviewUrl("")
      setUploadError(null)
      return
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed")
      return
    }

    if (file.size > 32 * 1024 * 1024) {
      setUploadError("Image must be smaller than 32MB")
      return
    }

    setUploadError(null)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Cleanup function
    return () => URL.revokeObjectURL(objectUrl)
  }

  const uploadImage = async (file: File): Promise<ImageUploadResult> => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadToImgBB(file)
      return result
    } catch (error) {
      const errorMessage = error instanceof ImageUploadError ? error.message : "Upload failed"
      setUploadError(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setPreviewUrl("")
    setUploadError(null)
    setIsUploading(false)
  }

  return {
    isUploading,
    previewUrl,
    uploadError,
    handleImageChange,
    uploadImage,
    resetUpload,
  }
}
