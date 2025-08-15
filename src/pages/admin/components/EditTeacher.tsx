"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { ChevronLeft, Save, X, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "../../../context/TranslationContext"
import { updateTeacherProfile, getTeacherA } from "../../../lib/api"
import { uploadToImgBB, ImageUploadError } from "../../../lib/imageUpload"
import ImageUpload from "../../../components/ImageUpload"

interface Teacher {
  id: string
  full_name: string
  about_me: string
  contact: string
  town: string
  current_work: string
  subjects: string[]
  available_days: string[]
  location: string[]
  user: string
  email: string
  password: string
  profile_image_url: string
  years_experience: number
  highest_diploma: string
  category: string
  gender: string
  is_approved: boolean
  success_rate: number
}

interface TeacherFormData extends Omit<Teacher, "id"> {
  previousPhotoId?: string
}

export default function AdminEditTeacherProfile() {
  const { id } = useParams<{ id: string }>()
  const { language } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState<TeacherFormData>({
    full_name: "",
    about_me: "",
    contact: "",
    town: "",
    current_work: "",
    subjects: [],
    available_days: [],
    location: [],
    user: "",
    email: "",
    password: "",
    years_experience: 0,
    highest_diploma: "",
    category: "franco",
    gender: "male",
    is_approved: false,
    success_rate: 30,
    profile_image_url: "",
    previousPhotoId: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false)
  const [customSubject, setCustomSubject] = useState("")

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const teacherData = await getTeacherA(id!)
        setFormData({
          ...teacherData,
          password: "",
          previousPhotoId: teacherData.profile_image_url,
        })
        setPreviewUrl(teacherData.profile_image_url || "")
      } catch (error) {
        toast.error(
          language === "en" ? "Failed to load teacher data" : "Échec du chargement des données de l'enseignant",
        )
        navigate("/admin-dashboard")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (id) fetchTeacherData()
  }, [id, navigate, language])

  // Image handling
  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(formData.profile_image_url || "")
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
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const { mutate: updateProfile, isLoading } = useMutation({
    mutationFn: async (formData: TeacherFormData) => {
      let imageUrl = formData.profile_image_url

      if (selectedFile) {
        setIsUploading(true)
        try {
          const uploadResult = await uploadToImgBB(selectedFile)
          imageUrl = uploadResult.url
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

      return updateTeacherProfile(id!, {
        ...formData,
        profile_image_url: imageUrl,
        previousPhotoId: formData.profile_image_url,
      })
    },
    onSuccess: () => {
      toast.success(language === "en" ? "Profile updated successfully" : "Profil mis à jour avec succès")
      queryClient.invalidateQueries(["teacher", id])
      navigate("/admin-dashboard")
    },
    onError: (error: Error) => {
      toast.error(error.message || (language === "en" ? "Update failed" : "Échec de la mise à jour"))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      ...formData,
      profile_image_url: previewUrl,
    })
  }

  const commonSubjects = [
    "Mathematics",
    "Physics",
    "SVT",
    "Biology",
    "English",
    "French",
    "Chimie",
    "Computer Science",
  ].sort()

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const handleArrayChange = (field: "subjects" | "available_days" | "location", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
    }))
  }

  const handleRemoveSubject = (subjectToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((subject) => subject !== subjectToRemove),
    }))
  }

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !formData.subjects.includes(customSubject.trim())) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, customSubject.trim()],
      }))
      setCustomSubject("")
    }
    setShowCustomSubjectInput(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    const formatted = value.startsWith("237") ? `+${value.slice(0, 13)}` : `+237${value.slice(0, 9)}`
    setFormData((prev) => ({ ...prev, contact: formatted }))
  }

  const handleLocationInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.currentTarget.value.trim()
      if (value && !formData.location.includes(value)) {
        setFormData((prev) => ({
          ...prev,
          location: [...prev.location, value],
        }))
        e.currentTarget.value = ""
      }
    }
  }

  const handleRemoveLocation = (locationToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      location: prev.location.filter((loc) => loc !== locationToRemove),
    }))
  }

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: Math.max(0, Number.parseInt(value) || 0),
    }))
  }

  const dayTranslations = {
    Monday: language === "en" ? "Monday" : "Lundi",
    Tuesday: language === "en" ? "Tuesday" : "Mardi",
    Wednesday: language === "en" ? "Wednesday" : "Mercredi",
    Thursday: language === "en" ? "Thursday" : "Jeudi",
    Friday: language === "en" ? "Friday" : "Vendredi",
    Saturday: language === "en" ? "Saturday" : "Samedi",
    Sunday: language === "en" ? "Sunday" : "Dimanche",
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-8">
          {language === "en" ? "Loading teacher data..." : "Chargement des données de l'enseignant..."}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>{language === "en" ? "Back to Management" : "Retour à la gestion"}</span>
            </button>

            <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {language === "en" ? "Edit Teacher Profile" : "Modifier le Profil de l'enseignant"}
            </h1>

            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex justify-center">
              <ImageUpload
                onImageSelect={handleImageSelect}
                previewUrl={previewUrl}
                error={uploadError}
                isUploading={isUploading}
                label={language === "en" ? "Profile Photo" : "Photo de profil"}
              />
            </div>

            {/* Admin-Editable Personal Info */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {language === "en" ? "Administrative Information" : "Informations administratives"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Full Name" : "Nom complet"}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Years of Experience" : "Années d'expérience"}
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleNumberInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Highest Diploma" : "Diplôme le plus élevé"}
                  </label>
                  <input
                    type="text"
                    name="highest_diploma"
                    value={formData.highest_diploma}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Category" : "Catégorie"}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="franco">Francophone</option>
                    <option value="anglo">Anglophone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Gender" : "Genre"}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleAdminInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="male">{language === "en" ? "Male" : "Homme"}</option>
                    <option value="female">{language === "en" ? "Female" : "Femme"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_approved"
                    checked={formData.is_approved}
                    onChange={handleAdminInputChange}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    {language === "en" ? "Approved Profile" : "Profil approuvé"}
                  </label>
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {language === "en" ? "Account Security" : "Sécurité du compte"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Email" : "Email"}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Username" : "Nom d'utilisateur"}
                  </label>
                  <input
                    type="text"
                    id="user"
                    name="user"
                    value={formData.user}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    minLength={3}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Password" : "Mot de passe"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder={
                        language === "en" ? "Leave empty to keep current" : "Laisser vide pour garder actuel"
                      }
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "en" ? "Minimum 4 characters" : "Minimum 4 caractères"}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable sections */}
            <div className="space-y-6">
              {/* About Me */}
              <div>
                <label htmlFor="about_me" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "en" ? "About Me" : "À propos de moi"}
                </label>
                <textarea
                  id="about_me"
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    language === "en" ? "Tell students about yourself..." : "Parlez de vous aux étudiants..."
                  }
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.about_me || "").length}/500 {language === "en" ? "characters" : "caractères"}
                </p>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="current_work" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Current Work" : "Travail actuel"}
                  </label>
                  <input
                    type="text"
                    id="current_work"
                    name="current_work"
                    value={formData.current_work}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Town" : "Ville"}
                  </label>
                  <input
                    type="text"
                    id="town"
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Phone Number" : "Numéro de téléphone"}
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handlePhoneChange}
                    placeholder="+2376XXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    pattern="\+237[0-9]{9}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "en" ? "Format: +2376XXXXXXXX" : "Format : +2376XXXXXXXX"}
                  </p>
                </div>

                {/* Success Rate */}
                <div>
                  <label htmlFor="success_rate" className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Success Rate (%)" : "Taux de réussite (%)"}
                  </label>
                  <input
                    type="number"
                    id="success_rate"
                    name="success_rate"
                    min="30"
                    max="100"
                    step="0.1"
                    value={formData.success_rate}
                    onChange={(e) => {
                      const numValue = Number.parseFloat(e.target.value)
                      if (!isNaN(numValue)) {
                        setFormData((prev) => ({
                          ...prev,
                          success_rate: Math.min(Math.max(numValue, 30), 100),
                        }))
                      }
                    }}
                    onBlur={(e) => {
                      const value = Number.parseFloat(e.target.value) || 30
                      setFormData((prev) => ({
                        ...prev,
                        success_rate: Math.min(Math.max(value, 30), 100),
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Teaching Locations" : "Lieux d'enseignement"}
                </label>
                <div className="mb-3">
                  <input
                    type="text"
                    onKeyDown={handleLocationInput}
                    placeholder={
                      language === "en" ? "Add location and press Enter" : "Ajouter un lieu et appuyez sur Entrée"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {formData.location.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.location.map((location) => (
                      <div key={location} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-sm">{location}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(location)}
                          className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                          aria-label={language === "en" ? "Remove location" : "Supprimer le lieu"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Subjects You Teach" : "Matières que vous enseignez"}
                </label>

                {/* Common subjects */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                  {commonSubjects.map((subject) => (
                    <div key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subject-${subject}`}
                        checked={(formData.subjects || []).includes(subject)}
                        onChange={() => handleArrayChange("subjects", subject)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`subject-${subject}`} className="ml-2 text-sm text-gray-700">
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Custom subjects */}
                <div className="space-y-2">
                  {formData.subjects
                    .filter((subject) => !commonSubjects.includes(subject))
                    .map((subject) => (
                      <div key={subject} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{subject}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          aria-label={language === "en" ? "Remove subject" : "Supprimer la matière"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                  {showCustomSubjectInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder={language === "en" ? "Enter subject name" : "Entrez le nom de la matière"}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSubject}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={!customSubject.trim()}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomSubjectInput(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomSubjectInput(true)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                    >
                      <Plus size={14} />
                      {language === "en" ? "Add custom subject" : "Ajouter une matière personnalisée"}
                    </button>
                  )}
                </div>
              </div>

              {/* Available Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Your Available Days" : "Vos jours disponibles"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allDays.map((day) => (
                    <div key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`day-${day}`}
                        checked={(formData.available_days || []).includes(day)}
                        onChange={() => handleArrayChange("available_days", day)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`day-${day}`} className="ml-2 text-sm text-gray-700">
                        {dayTranslations[day]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/admin-dashboard")}
                className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                <X size={18} />
                {language === "en" ? "Cancel" : "Annuler"}
              </button>

              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {isLoading || isUploading
                  ? language === "en"
                    ? "Saving..."
                    : "Enregistrement..."
                  : language === "en"
                    ? "Save Changes"
                    : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
