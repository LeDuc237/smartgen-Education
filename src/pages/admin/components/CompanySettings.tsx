"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { Save, Building, Mail, Phone, MapPin, Globe, Info } from "lucide-react"
import { useTranslation } from "../../../context/TranslationContext"
import { useAuthStore } from "../../../store/authStore"
import { supabase } from "../../../lib/supabase"
import { uploadToImgBB, ImageUploadError } from "../../../lib/imageUpload"
import ImageUpload from "../../../components/ImageUpload"
import type { CompanyInfo } from "../../../lib/types"

export default function CompanySettings() {
  const { language } = useTranslation()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [selectedAboutImage1, setSelectedAboutImage1] = useState<File | null>(null)
  const [aboutImage1Preview, setAboutImage1Preview] = useState<string>("")
  const [selectedAboutImage2, setSelectedAboutImage2] = useState<File | null>(null)
  const [aboutImage2Preview, setAboutImage2Preview] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Check permissions - only promoteur and chef coordonateur can modify company settings
  const canModifySettings = profile?.role === "promoteur" || profile?.role === "chef coordonateur"

  const { data: companyInfo, isLoading } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_info").select("*").single()
      if (error) throw error
      return data as CompanyInfo
    },
  })

  const [formData, setFormData] = useState<Partial<CompanyInfo>>(companyInfo || {})

  // Update form data when company info is loaded
  useEffect(() => {
    if (companyInfo) {
      setFormData(companyInfo)
      if (companyInfo.logo) {
        setLogoPreview(companyInfo.logo)
      }
      if (companyInfo.about_image1_url) {
        setAboutImage1Preview(companyInfo.about_image1_url)
      }
      if (companyInfo.about_image2_url) {
        setAboutImage2Preview(companyInfo.about_image2_url)
      }
    }
  }, [companyInfo])

  // Image handling functions
  const handleLogoSelect = (file: File | null) => {
    if (!canModifySettings) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can modify company settings"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres",
      )
      return
    }

    if (!file) {
      setSelectedLogo(null)
      setLogoPreview(companyInfo?.logo || "")
      setUploadError(null)
      return
    }

    if (validateImage(file)) {
      setSelectedLogo(file)
      const objectUrl = URL.createObjectURL(file)
      setLogoPreview(objectUrl)
    }
  }

  const handleAboutImage1Select = (file: File | null) => {
    if (!canModifySettings) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can modify company settings"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres",
      )
      return
    }

    if (!file) {
      setSelectedAboutImage1(null)
      setAboutImage1Preview(companyInfo?.about_image1_url || "")
      setUploadError(null)
      return
    }

    if (validateImage(file)) {
      setSelectedAboutImage1(file)
      const objectUrl = URL.createObjectURL(file)
      setAboutImage1Preview(objectUrl)
    }
  }

  const handleAboutImage2Select = (file: File | null) => {
    if (!canModifySettings) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can modify company settings"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres",
      )
      return
    }

    if (!file) {
      setSelectedAboutImage2(null)
      setAboutImage2Preview(companyInfo?.about_image2_url || "")
      setUploadError(null)
      return
    }

    if (validateImage(file)) {
      setSelectedAboutImage2(file)
      const objectUrl = URL.createObjectURL(file)
      setAboutImage2Preview(objectUrl)
    }
  }

  const validateImage = (file: File): boolean => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      setUploadError(language === "en" ? "Only image files are allowed" : "Seuls les fichiers image sont autorisés")
      return false
    }

    if (file.size > 32 * 1024 * 1024) {
      setUploadError(language === "en" ? "Image must be smaller than 32MB" : "L'image doit être inférieure à 32Mo")
      return false
    }

    setUploadError(null)
    return true
  }

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CompanyInfo>) => {
      if (!canModifySettings) {
        throw new Error(
          language === "en"
            ? "Only promoteur and chef coordonateur can modify company settings"
            : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres de l'entreprise",
        )
      }

      let logoUrl = formData.logo
      let aboutImage1Url = formData.about_image1_url
      let aboutImage2Url = formData.about_image2_url

      setIsUploading(true)
      try {
        // Upload logo if selected
        if (selectedLogo) {
          const uploadResult = await uploadToImgBB(selectedLogo)
          logoUrl = uploadResult.url
        }

        // Upload about image 1 if selected
        if (selectedAboutImage1) {
          const uploadResult = await uploadToImgBB(selectedAboutImage1)
          aboutImage1Url = uploadResult.url
        }

        // Upload about image 2 if selected
        if (selectedAboutImage2) {
          const uploadResult = await uploadToImgBB(selectedAboutImage2)
          aboutImage2Url = uploadResult.url
        }
      } catch (error) {
        const errorMessage =
          error instanceof ImageUploadError
            ? error.message
            : language === "en"
              ? "Image upload failed"
              : "Échec du téléchargement de l'image"
        throw new Error(errorMessage)
      } finally {
        setIsUploading(false)
      }

      const { data: updatedData, error } = await supabase
        .from("company_info")
        .update({
          ...data,
          logo: logoUrl,
          about_image1_url: aboutImage1Url,
          about_image2_url: aboutImage2Url,
        })
        .eq("id", companyInfo?.id)
        .select()
        .single()

      if (error) throw error
      return updatedData
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyInfo"])
      toast.success(language === "en" ? "Settings updated successfully" : "Paramètres mis à jour avec succès")
    },
    onError: (error: any) => {
      toast.error(
        error.message || (language === "en" ? "Failed to update settings" : "Échec de la mise à jour des paramètres"),
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canModifySettings) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can modify company settings"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres",
      )
      return
    }

    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{language === "en" ? "Company Settings" : "Paramètres de l'entreprise"}</h2>
        {!canModifySettings && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            {language === "en" ? "Read Only" : "Lecture seule"}
          </div>
        )}
      </div>

      {/* Permission Notice */}
      {!canModifySettings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {language === "en"
              ? "Only promoteur and chef coordonateur can modify company settings. You can view the current settings below."
              : "Seuls le promoteur et le chef coordonateur peuvent modifier les paramètres de l'entreprise. Vous pouvez consulter les paramètres actuels ci-dessous."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{language === "en" ? "Company Logo" : "Logo de l'entreprise"}</h3>
          <div className="flex justify-center">
            <ImageUpload
              onImageSelect={handleLogoSelect}
              previewUrl={logoPreview}
              error={uploadError}
              isUploading={isUploading}
              label={language === "en" ? "Company Logo" : "Logo de l'entreprise"}
              className="w-full max-w-xs"
            />
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            <p>{language === "en" ? "Recommended size: 200x200px" : "Taille recommandée : 200x200px"}</p>
            <p>{language === "en" ? "Max file size: 32MB" : "Taille maximale : 32Mo"}</p>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-500" />
            {language === "en" ? "Company Information" : "Informations de l'entreprise"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "en" ? "Company Name" : "Nom de l'entreprise"}
              </label>
              <input
                type="text"
                name="Name"
                value={formData.Name || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                {language === "en" ? "Email" : "Email"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {language === "en" ? "Contact Number" : "Numéro de contact"}
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {language === "en" ? "WhatsApp Number" : "Numéro WhatsApp"}
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                {language === "en" ? "Location" : "Emplacement"}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                {language === "en" ? "Address" : "Adresse"}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            {language === "en" ? "About Information" : "Informations à propos"}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                {language === "en" ? "About Us (English)" : "À propos (Anglais)"}
              </label>
              <textarea
                rows={4}
                name="about_us_en"
                value={formData.about_us_en || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                {language === "en" ? "About Us (French)" : "À propos (Français)"}
              </label>
              <textarea
                rows={4}
                name="about_us_fr"
                value={formData.about_us_fr || ""}
                onChange={handleInputChange}
                disabled={!canModifySettings}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* About Image 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {language === "en" ? "About Image 1" : "Image À propos 1"}
              </label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <ImageUpload
                    onImageSelect={handleAboutImage1Select}
                    previewUrl={aboutImage1Preview}
                    error={uploadError}
                    isUploading={isUploading}
                    label={language === "en" ? "Upload About Image 1" : "Télécharger Image À propos 1"}
                    className="w-full max-w-md mx-auto"
                  />
                </div>

                <div className="text-center text-gray-500 text-sm">{language === "en" ? "OR" : "OU"}</div>

                <input
                  type="url"
                  name="about_image1_url"
                  value={formData.about_image1_url || ""}
                  onChange={(e) => {
                    handleInputChange(e)
                    if (e.target.value) {
                      setSelectedAboutImage1(null)
                      setAboutImage1Preview(e.target.value)
                    }
                  }}
                  disabled={!canModifySettings}
                  placeholder="https://example.com/image1.jpg"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* About Image 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {language === "en" ? "About Image 2" : "Image À propos 2"}
              </label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <ImageUpload
                    onImageSelect={handleAboutImage2Select}
                    previewUrl={aboutImage2Preview}
                    error={uploadError}
                    isUploading={isUploading}
                    label={language === "en" ? "Upload About Image 2" : "Télécharger Image À propos 2"}
                    className="w-full max-w-md mx-auto"
                  />
                </div>

                <div className="text-center text-gray-500 text-sm">{language === "en" ? "OR" : "OU"}</div>

                <input
                  type="url"
                  name="about_image2_url"
                  value={formData.about_image2_url || ""}
                  onChange={(e) => {
                    handleInputChange(e)
                    if (e.target.value) {
                      setSelectedAboutImage2(null)
                      setAboutImage2Preview(e.target.value)
                    }
                  }}
                  disabled={!canModifySettings}
                  placeholder="https://example.com/image2.jpg"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {canModifySettings && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isLoading || isUploading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {updateMutation.isLoading || isUploading
                ? language === "en"
                  ? "Saving..."
                  : "Enregistrement..."
                : language === "en"
                  ? "Save Changes"
                  : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
