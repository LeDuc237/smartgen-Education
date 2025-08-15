import type React from "react"
import { useRef } from "react"
import { Upload, X, AlertCircle } from "lucide-react"

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void
  previewUrl?: string
  error?: string | null
  isUploading?: boolean
  className?: string
  label?: string
  required?: boolean
}

export default function ImageUpload({
  onImageSelect,
  previewUrl,
  error,
  isUploading = false,
  className = "",
  label = "Profile Photo",
  required = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onImageSelect(file)
  }

  const handleRemoveImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageSelect(null)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isUploading}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={handleClick}
              disabled={isUploading}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
              aria-label="Change image"
            >
              <Upload size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">Supported formats: PNG, JPG, GIF. Max size: 32MB</p>
    </div>
  )
}
