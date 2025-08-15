import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { useTranslation } from "../context/TranslationContext"
import { useAuthStore } from "../store/authStore"
import { updateTeacherProfiles } from "../lib/api"
import { uploadToImgBB, ImageUploadError } from "../lib/imageUpload"
import ImageUpload from "../components/ImageUpload"
import { ChevronLeft, Save, BookOpen, UserCircle,  X, Plus, Trash2, Eye, EyeOff, Menu, Globe } from "lucide-react"

interface TeacherFormData {
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
}

export default function EditTeacherProfile() {
  const { state } = useLocation()
  const { profile, isLoading: isAuthLoading } = useAuthStore()
  const { language, toggleLanguage } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Form state initialized with current profile data
  const [formData, setFormData] = useState<TeacherFormData>({
    about_me: state?.about_me || "",
    contact: state?.contact || "",
    town: state?.town || "",
    current_work: state?.current_work || "",
    subjects: state?.subjects || [],
    available_days: state?.available_days || [],
    location: state?.location || [],
    user: state?.user || "",
    email: state?.email || "",
    password: "",
    profile_image_url: state?.profile_image_url || "",
  })

  const [customSubject, setCustomSubject] = useState("")
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(state?.profile_image_url || "")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Common subjects for suggestions
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

  // Authentication check
  useEffect(() => {
    if (!isAuthLoading && !profile) {
      navigate("/teacher-login", { replace: true })
    }
  }, [profile, isAuthLoading, navigate])

  // Image handling
  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(state?.profile_image_url || "")
      setUploadError(null)
      return
    }

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

  // Mutation for updating profile
  const { mutate: updateProfile, isLoading } = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("User not authenticated")

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

      const formPayload = new FormData()
      formPayload.append(
        "data",
        JSON.stringify({
          ...formData,
          profile_image_url: imageUrl,
        }),
      )

      return await updateTeacherProfiles(profile.id, formPayload)
    },

    onSuccess: () => {
      toast.success(language === "en" ? "Profile updated!" : "Profil mis à jour")
      queryClient.invalidateQueries(["teacher", profile.id])
      navigate("/teacher-dashboard")
    },
    onError: (error: Error) => {
      toast.error(error.message || (language === "en" ? "Update failed" : "Échec de la mise à jour"))
      if (error.message.includes("auth")) navigate("/teacher-dashboard")
    },
  })

  const handleArrayChange = (field: "subjects" | "available_days" | "location", value: string) => {
    setFormData((prev) => {
      const currentArray = [...prev[field]]
      const index = currentArray.indexOf(value)

      if (index === -1) {
        currentArray.push(value)
      } else {
        currentArray.splice(index, 1)
      }

      return {
        ...prev,
        [field]: currentArray,
      }
    })
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
    const value = e.target.value
    const cleaned = value.replace(/\D/g, "")
    let formatted = cleaned

    if (cleaned.startsWith("237")) {
      formatted = "+237" + cleaned.slice(3, 12)
    } else {
      formatted = "+237" + cleaned.slice(0, 9)
    }

    setFormData((prev) => ({
      ...prev,
      contact: formatted,
    }))
  }

  const handleLocationInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      e.preventDefault()
      const newLocation = e.currentTarget.value.trim()
      if (!formData.location.includes(newLocation)) {
        setFormData((prev) => ({
          ...prev,
          location: [...prev.location, newLocation],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile()
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

  if (isAuthLoading || !profile) {
    return <div className="text-center py-8">{language === "en" ? "Loading..." : "Chargement..."}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header with same design as TeacherDashboard */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Profile info */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-base md:text-lg border-2 border-white/30">
                {profile.full_name?.charAt(0)?.toUpperCase() || "T"}
              </div>
              <div>
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                  {language === "en" ? "Edit Profile" : "Modifier le Profil"}
                </h1>
                <p className="text-blue-100 text-xs md:text-sm">
                  {language === "en" ? "Teacher Profile" : "Profil Enseignant"}
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-white border border-white/20"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Language toggle (desktop) */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-white border border-white/20"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language === "en" ? "FR" : "EN"}</span>
              </button>

              {/* Back to Dashboard (desktop) */}
              <button
                onClick={() => navigate("/teacher-dashboard")}
                className="hidden sm:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 md:px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">
                  {language === "en" ? "Back to Dashboard" : "Retour au Tableau de bord"}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile menu content */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex flex-col gap-3">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === "en" ? "Français" : "English"}</span>
                </button>
                <button
                  onClick={() => navigate("/teacher-dashboard")}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all"
                >
                  <ChevronLeft size={18} />
                  {language === "en" ? "Back to Dashboard" : "Retour au Tableau de bord"}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

            {/* Read-only personal info section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-600" />
                {language === "en" ? "Personal Information" : "Informations personnelles"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Full Name" : "Nom complet"}
                  </label>
                  <input
                    type="text"
                    value={state?.full_name || ""}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Gender" : "Genre"}
                  </label>
                  <input
                    type="text"
                    value={
                      state?.gender === "female"
                        ? language === "en"
                          ? "Female"
                          : "Femme"
                        : language === "en"
                          ? "Male"
                          : "Homme"
                    }
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Years of Experience" : "Années d'expérience"}
                  </label>
                  <input
                    type="text"
                    value={`${state?.years_experience} ${language === "en" ? "years" : "ans"}`}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Highest Diploma" : "Diplôme le plus élevé"}
                  </label>
                  <input
                    type="text"
                    value={state?.highest_diploma || ""}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Category" : "Catégorie"}
                  </label>
                  <input
                    type="text"
                    value={
                      state?.category === "anglo"
                        ? language === "en"
                          ? "Anglophone"
                          : "Anglophone"
                        : language === "en"
                          ? "Francophone"
                          : "Francophone"
                    }
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                {language === "en" ? "Account Security" : "Sécurité du compte"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {formData.about_me.length}/500 {language === "en" ? "characters" : "caractères"}
                </p>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        checked={formData.subjects.includes(subject)}
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
                        checked={formData.available_days.includes(day)}
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
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/teacher-dashboard")}
                className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                <X size={18} />
                {language === "en" ? "Cancel" : "Annuler"}
              </button>

              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
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