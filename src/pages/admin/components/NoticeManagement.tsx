"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { Plus, Edit, Trash2, ImageIcon, FileText, LinkIcon, Video, Calendar, User, ArrowRight, X } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "../../../context/TranslationContext"
import { useAuthStore } from "../../../store/authStore"
import { supabase } from "../../../lib/supabase"
import { uploadToImgBB, ImageUploadError } from "../../../lib/imageUpload"
import ImageUpload from "../../../components/ImageUpload"
import type { Notice } from "../../../lib/types"

export default function NoticeManagement() {
  const { language } = useTranslation()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "text" as "text" | "image" | "video" | "link",
  })

  // Check permissions - only promoteur and chef coordonateur can manage notices
  const canManageNotices = profile?.role === "promoteur" || profile?.role === "chef coordonateur"

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data as Notice[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (notice: Omit<Notice, "id" | "created_at" | "updated_at">) => {
      if (!canManageNotices) {
        throw new Error(
          language === "en"
            ? "Only promoteur and chef coordonateur can create notices"
            : "Seuls le promoteur et le chef coordonateur peuvent créer des annonces",
        )
      }

      let contentUrl = notice.content

      // Handle image upload if there's a selected image
      if (selectedImage && notice.type === "image") {
        setIsUploading(true)
        try {
          const uploadResult = await uploadToImgBB(selectedImage)
          contentUrl = uploadResult.url
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
      }

      const { data, error } = await supabase
        .from("notices")
        .insert([{ ...notice, content: contentUrl }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notices"])
      resetForm()
      toast.success(language === "en" ? "Notice created successfully" : "Annonce créée avec succès")
    },
    onError: (error: any) => {
      toast.error(
        error.message || (language === "en" ? "Failed to create notice" : "Échec de la création de l'annonce"),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (notice: Partial<Notice> & { id: string }) => {
      if (!canManageNotices) {
        throw new Error(
          language === "en"
            ? "Only promoteur and chef coordonateur can update notices"
            : "Seuls le promoteur et le chef coordonateur peuvent modifier des annonces",
        )
      }

      let contentUrl = notice.content

      // Handle image upload if there's a selected image
      if (selectedImage && notice.type === "image") {
        setIsUploading(true)
        try {
          const uploadResult = await uploadToImgBB(selectedImage)
          contentUrl = uploadResult.url
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
      }

      const { data, error } = await supabase
        .from("notices")
        .update({ ...notice, content: contentUrl })
        .eq("id", notice.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notices"])
      resetForm()
      toast.success(language === "en" ? "Notice updated successfully" : "Annonce mise à jour avec succès")
    },
    onError: (error: any) => {
      toast.error(
        error.message || (language === "en" ? "Failed to update notice" : "Échec de la mise à jour de l'annonce"),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canManageNotices) {
        throw new Error(
          language === "en"
            ? "Only promoteur and chef coordonateur can delete notices"
            : "Seuls le promoteur et le chef coordonateur peuvent supprimer des annonces",
        )
      }

      const { error } = await supabase.from("notices").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notices"])
      toast.success(language === "en" ? "Notice deleted successfully" : "Annonce supprimée avec succès")
    },
    onError: (error: any) => {
      toast.error(
        error.message || (language === "en" ? "Failed to delete notice" : "Échec de la suppression de l'annonce"),
      )
    },
  })

  const resetForm = () => {
    setIsModalOpen(false)
    setEditingNotice(null)
    setFormData({ title: "", content: "", type: "text" })
    setSelectedImage(null)
    setImagePreview("")
    setUploadError(null)
  }

  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedImage(null)
      setImagePreview("")
      setUploadError(null)
      return
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      setUploadError(language === "en" ? "Only image files are allowed" : "Seuls les fichiers image sont autorisés")
      return
    }

    if (file.size > 32 * 1024 * 1024) {
      setUploadError(language === "en" ? "Image must be smaller than 32MB" : "L'image doit être inférieure à 32Mo")
      return
    }

    setUploadError(null)
    setSelectedImage(file)
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || (!formData.content && !selectedImage)) {
      toast.error(language === "en" ? "Please fill all required fields" : "Veuillez remplir tous les champs requis")
      return
    }

    if (editingNotice) {
      updateMutation.mutate({ ...formData, id: editingNotice.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (notice: Notice) => {
    if (!canManageNotices) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can edit notices"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier des annonces",
      )
      return
    }

    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
    })

    // Set image preview if it's an image type
    if (notice.type === "image" && notice.content) {
      setImagePreview(notice.content)
    }

    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!canManageNotices) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can delete notices"
          : "Seuls le promoteur et le chef coordonateur peuvent supprimer des annonces",
      )
      return
    }

    if (window.confirm(language === "en" ? "Are you sure?" : "Êtes-vous sûr ?")) {
      deleteMutation.mutate(id)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-5 h-5" />
      case "video":
        return <Video className="w-5 h-5" />
      case "link":
        return <LinkIcon className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const LoadingCard = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )

  const NoticeCard = ({ notice, index }: { notice: Notice; index: number }) => (
    <motion.article
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Content Preview */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden">
        {notice.type === "image" && (
          <img
            src={notice.content || "/placeholder.svg"}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {notice.type === "video" && (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Video Content</p>
            </div>
          </div>
        )}
        {(notice.type === "text" || notice.type === "link") && (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <div className="text-white text-center p-6">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-bold line-clamp-2">{notice.title}</h3>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm ${
              notice.type === "text"
                ? "bg-blue-600"
                : notice.type === "image"
                  ? "bg-green-600"
                  : notice.type === "video"
                    ? "bg-purple-600"
                    : "bg-orange-600"
            }`}
          >
            {notice.type === "text"
              ? language === "en"
                ? "Article"
                : "Article"
              : notice.type === "image"
                ? language === "en"
                  ? "Image"
                  : "Image"
                : notice.type === "video"
                  ? language === "en"
                    ? "Video"
                    : "Vidéo"
                  : language === "en"
                    ? "Resource"
                    : "Ressource"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {notice.title}
        </h2>

        {notice.type === "text" && <p className="text-gray-600 mb-4 line-clamp-3">{notice.content}</p>}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(notice.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{language === "en" ? "SmartGen Educ" : "SmartGen Educ"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {notice.type === "link" ? (
              <a
                href={notice.content}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm"
              >
                {language === "en" ? "View Resource" : "Voir la ressource"}
                <ArrowRight size={14} />
              </a>
            ) : notice.type === "video" ? (
              <a
                href={notice.content}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm"
              >
                {language === "en" ? "Watch Video" : "Regarder la vidéo"}
                <ArrowRight size={14} />
              </a>
            ) : (
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm">
                {language === "en" ? "Read More" : "Lire plus"}
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {canManageNotices && (
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(notice)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={language === "en" ? "Edit" : "Modifier"}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(notice.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={language === "en" ? "Delete" : "Supprimer"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )

  // Show permission notice if user doesn't have management rights
  if (!canManageNotices) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">
              {language === "en" ? "Access Restricted" : "Accès Restreint"}
            </h2>
            <p className="text-yellow-700">
              {language === "en"
                ? "Only promoteur and chef coordonateur can manage notices. Contact your administrator for access."
                : "Seuls le promoteur et le chef coordonateur peuvent gérer les annonces. Contactez votre administrateur pour l'accès."}
            </p>
          </div>

          {/* Show notices in read-only mode */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              {language === "en" ? "Current Notices" : "Annonces actuelles"}
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <LoadingCard key={index} />
                ))}
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2">
                  {language === "en" ? "No notices found" : "Aucune annonce trouvée"}
                </h3>
                <p className="text-gray-500">
                  {language === "en"
                    ? "There are no notices to display at the moment"
                    : "Il n'y a aucune annonce à afficher pour le moment"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notices.map((notice, index) => (
                  <NoticeCard key={notice.id} notice={notice} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {language === "en" ? "Notice Management" : "Gestion des annonces"}
              </h1>
              <p className="text-gray-600">
                {language === "en"
                  ? "Create and manage educational content and announcements"
                  : "Créer et gérer le contenu éducatif et les annonces"}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {language === "en" ? "Add Notice" : "Ajouter une annonce"}
            </button>
          </div>
        </div>

        {/* Notices Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">
              {language === "en" ? "No notices yet" : "Aucune annonce pour le moment"}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === "en"
                ? "Create your first notice to share with students and teachers"
                : "Créez votre première annonce à partager avec les étudiants et enseignants"}
            </p>
            <button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === "en" ? "Create First Notice" : "Créer la première annonce"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notices.map((notice, index) => (
              <NoticeCard key={notice.id} notice={notice} index={index} />
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingNotice
                    ? language === "en"
                      ? "Edit Notice"
                      : "Modifier l'annonce"
                    : language === "en"
                      ? "Add Notice"
                      : "Ajouter une annonce"}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === "en" ? "Title" : "Titre"} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder={language === "en" ? "Enter notice title..." : "Entrez le titre de l'annonce..."}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === "en" ? "Type" : "Type"} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as Notice["type"]
                      setFormData({ ...formData, type: newType, content: "" })
                      setSelectedImage(null)
                      setImagePreview("")
                      setUploadError(null)
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="text">{language === "en" ? "Text Article" : "Article Texte"}</option>
                    <option value="image">{language === "en" ? "Image" : "Image"}</option>
                    <option value="video">{language === "en" ? "Video" : "Vidéo"}</option>
                    <option value="link">{language === "en" ? "Link/Resource" : "Lien/Ressource"}</option>
                  </select>
                </div>

                {/* Content Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === "en" ? "Content" : "Contenu"} *
                  </label>

                  {formData.type === "text" && (
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      placeholder={
                        language === "en" ? "Write your article content..." : "Rédigez le contenu de votre article..."
                      }
                      required
                    />
                  )}

                  {formData.type === "image" && (
                    <div className="space-y-4">
                      {/* Image Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <ImageUpload
                          onImageSelect={handleImageSelect}
                          previewUrl={imagePreview}
                          error={uploadError}
                          isUploading={isUploading}
                          label={language === "en" ? "Upload Image" : "Télécharger une image"}
                          className="w-full"
                        />
                      </div>

                      {/* Alternative URL Input */}
                      <div className="text-center text-gray-500 text-sm">{language === "en" ? "OR" : "OU"}</div>

                      <input
                        type="url"
                        value={formData.content}
                        onChange={(e) => {
                          setFormData({ ...formData, content: e.target.value })
                          if (e.target.value) {
                            setSelectedImage(null)
                            setImagePreview(e.target.value)
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      />

                      <p className="text-sm text-gray-500">
                        {language === "en"
                          ? "Upload an image file or provide an image URL"
                          : "Téléchargez un fichier image ou fournissez une URL d'image"}
                      </p>
                    </div>
                  )}

                  {formData.type === "video" && (
                    <input
                      type="url"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  )}

                  {formData.type === "link" && (
                    <input
                      type="url"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    {language === "en" ? "Cancel" : "Annuler"}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading || isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isLoading || updateMutation.isLoading || isUploading
                      ? language === "en"
                        ? "Processing..."
                        : "Traitement..."
                      : editingNotice
                        ? language === "en"
                          ? "Update"
                          : "Mettre à jour"
                        : language === "en"
                          ? "Create"
                          : "Créer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
