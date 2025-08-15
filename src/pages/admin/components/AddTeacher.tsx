"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { Plus, X, Trash2 } from "lucide-react"
import { useTranslation } from "../../../context/TranslationContext"
import { createTeachers } from "../../../lib/api"
import { uploadToImgBB, ImageUploadError } from "../../../lib/imageUpload"
import ImageUpload from "../../../components/ImageUpload"
import bcrypt from "bcryptjs"

interface TeacherFormData {
  full_name: string
  user: string
  email: string
  password: string
  contact: string
  highest_diploma: string
  subjects: string[]
  location: string[]
  gender: "male" | "female"
  category: "anglo" | "franco"
  town: string
  years_experience: string
  profile_image_url: string
  about_me: string
  current_work: string
  available_days: string[]
  is_approved: boolean
  success_rate: number
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

const commonLocations = ["Melen", "Deido", "Emana", "Biyem-Assi", "Essos", "Nkolbisson", "Ndokoti", "Mokolo"].sort()

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function AddTeacher() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [formData, setFormData] = useState<TeacherFormData>({
    full_name: "",
    user: "",
    email: "",
    password: "",
    contact: "",
    highest_diploma: "",
    subjects: [],
    location: [],
    gender: "male",
    category: "anglo",
    town: "",
    years_experience: "",
    profile_image_url: "",
    about_me: "",
    current_work: "",
    available_days: [],
    is_approved: false,
    success_rate: 30,
  })

  const [customSubject, setCustomSubject] = useState("")
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false)
  const [customLocation, setCustomLocation] = useState("")
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false)

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

  const handleAddCustom = (field: "subjects" | "location", value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }))
      field === "subjects" ? setCustomSubject("") : setCustomLocation("")
    }
  }

  const handleRemoveItem = (field: "subjects" | "location", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }))
  }

  // Image handling
  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl("")
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const requiredFields = [
      formData.user,
      formData.email,
      formData.full_name,
      formData.town,
      formData.subjects.length,
      formData.location.length,
    ]

    if (requiredFields.some((field) => !field)) {
      toast.error(
        language === "en" ? "Please fill in all required fields." : "Veuillez remplir tous les champs obligatoires.",
      )
      setIsSubmitting(false)
      return
    }

    try {
      let imageUrl = ""

      // Upload image if selected
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
          toast.error(errorMessage)
          setIsSubmitting(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      const hashedPassword = await bcrypt.hash(formData.password, 10)
      const submissionData = {
        ...formData,
        password: hashedPassword,
        profile_image_url: imageUrl,
      }

      await createTeachers(submissionData)
      toast.success(language === "en" ? "Teacher added successfully!" : "Enseignant ajouté avec succès !")
      navigate("/admin-dashboard")
    } catch (error: any) {
      toast.error(
        error.message ||
          (language === "en"
            ? "Failed to add teacher. Please try again."
            : "Échec de l'ajout de l'enseignant. Veuillez réessayer."),
      )
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "")
    let formatted = cleaned

    if (cleaned.startsWith("237")) {
      formatted = `+${cleaned}`
    } else if (cleaned.length > 0) {
      formatted = `+237${cleaned}`
    }

    setFormData({ ...formData, contact: formatted.slice(0, 13) })
  }

  const RequiredStar = () => <span className="text-red-500">*</span>

  const dayTranslations = {
    Monday: language === "en" ? "Monday" : "Lundi",
    Tuesday: language === "en" ? "Tuesday" : "Mardi",
    Wednesday: language === "en" ? "Wednesday" : "Mercredi",
    Thursday: language === "en" ? "Thursday" : "Jeudi",
    Friday: language === "en" ? "Friday" : "Vendredi",
    Saturday: language === "en" ? "Saturday" : "Samedi",
    Sunday: language === "en" ? "Sunday" : "Dimanche",
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {language === "en" ? "Add New Teacher" : "Ajouter un nouvel enseignant"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <InputField
            label={
              <>
                {language === "en" ? "Full Name" : "Nom Complet"} <RequiredStar />
              </>
            }
            value={formData.full_name}
            onChange={(val) => setFormData({ ...formData, full_name: val })}
          />

          <InputField
            label={
              <>
                {language === "en" ? "Username" : "Nom d'utilisateur"} <RequiredStar />
              </>
            }
            value={formData.user}
            onChange={(val) => setFormData({ ...formData, user: val })}
          />

          <InputField
            label={
              <>
                {language === "en" ? "Email" : "Email"} <RequiredStar />
              </>
            }
            type="email"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
          />

          <InputField
            label={
              <>
                {language === "en" ? "Password" : "Mot de passe"} <RequiredStar />
              </>
            }
            type="password"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
          />

          <InputField
            label={
              <>
                {language === "en" ? "Phone Number" : "Numéro de téléphone"} <RequiredStar />
              </>
            }
            value={formData.contact}
            onChange={handlePhoneChange}
            placeholder="+237 6XX XXX XXX"
            type="tel"
            maxLength={13}
          />

          <InputField
            label={
              <>
                {language === "en" ? "Town" : "Ville"} <RequiredStar />
              </>
            }
            value={formData.town}
            onChange={(val) => setFormData({ ...formData, town: val })}
          />

          {/* Subjects Field */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "en" ? "Subjects Taught" : "Matières enseignées"} <RequiredStar />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {commonSubjects.map((subject) => (
                <div key={subject} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleArrayChange("subjects", subject)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{subject}</label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {formData.subjects
                .filter((s) => !commonSubjects.includes(s))
                .map((subject) => (
                  <div key={subject} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{subject}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("subjects", subject)}
                      className="text-red-500 hover:text-red-700"
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
                    placeholder={language === "en" ? "Enter subject" : "Nouvelle matière"}
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddCustom("subjects", customSubject)
                      setShowCustomSubjectInput(false)
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomSubjectInput(false)}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomSubjectInput(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus size={14} />
                  {language === "en" ? "Add custom subject" : "Ajouter une matière"}
                </button>
              )}
            </div>
          </div>

          {/* Locations Field */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "en" ? "Teaching Locations" : "Lieux d'enseignement"} <RequiredStar />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {commonLocations.map((location) => (
                <div key={location} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.location.includes(location)}
                    onChange={() => handleArrayChange("location", location)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{location}</label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {formData.location
                .filter((l) => !commonLocations.includes(l))
                .map((location) => (
                  <div key={location} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{location}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("location", location)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

              {showCustomLocationInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder={language === "en" ? "Enter location" : "Nouveau lieu"}
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddCustom("location", customLocation)
                      setShowCustomLocationInput(false)
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomLocationInput(false)}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomLocationInput(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus size={14} />
                  {language === "en" ? "Add custom location" : "Ajouter un lieu"}
                </button>
              )}
            </div>
          </div>

          {/* Additional Fields */}
          <InputField
            label={language === "en" ? "Highest Diploma" : "Diplôme le plus élevé"}
            value={formData.highest_diploma}
            onChange={(val) => setFormData({ ...formData, highest_diploma: val })}
          />

          <InputField
            label={language === "en" ? "Experience (years)" : "Expérience (années)"}
            type="number"
            min="0"
            value={formData.years_experience}
            onChange={(val) => setFormData({ ...formData, years_experience: val })}
          />

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_approved}
                onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {language === "en" ? "Approved Teacher" : "Enseignant approuvé"}
              </span>
            </label>
          </div>

          <InputField
            label={language === "en" ? "Success Rate (%)" : "Taux de réussite (%)"}
            type="number"
            min={30}
            max={100}
            value={formData.success_rate.toString()}
            placeholder="30-100"
            onChange={(val) => {
              const numValue = Number.parseInt(val)
              if (!isNaN(numValue) && numValue >= 30 && numValue <= 100) {
                setFormData({ ...formData, success_rate: numValue })
              }
            }}
            onBlur={() => {
              if (formData.success_rate === undefined || formData.success_rate < 30) {
                setFormData({ ...formData, success_rate: 30 })
              } else if (formData.success_rate > 100) {
                setFormData({ ...formData, success_rate: 100 })
              }
            }}
          />

          <InputField
            label={language === "en" ? "Current Work" : "Travail actuel"}
            value={formData.current_work}
            onChange={(val) => setFormData({ ...formData, current_work: val })}
          />

          <SelectField
            label={language === "en" ? "Gender" : "Sexe"}
            value={formData.gender}
            options={{
              male: language === "en" ? "Male" : "Homme",
              female: language === "en" ? "Female" : "Femme",
            }}
            onChange={(val) => setFormData({ ...formData, gender: val as "male" | "female" })}
          />

          <SelectField
            label={language === "en" ? "Category" : "Catégorie"}
            value={formData.category}
            options={{
              anglo: language === "en" ? "Anglophone" : "Anglophone",
              franco: language === "en" ? "Francophone" : "Francophone",
            }}
            onChange={(val) => setFormData({ ...formData, category: val as "anglo" | "franco" })}
          />

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

        {/* About Me */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {language === "en" ? "About Me" : "À propos de moi"}
          </label>
          <textarea
            value={formData.about_me}
            onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
            maxLength={500}
            className="w-full px-3 py-2 border rounded-md"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            {formData.about_me.length}/500 {language === "en" ? "characters" : "caractères"}
          </p>
        </div>

        {/* Profile Photo Upload */}
        <div className="flex justify-center">
          <ImageUpload
            onImageSelect={handleImageSelect}
            previewUrl={previewUrl}
            error={uploadError}
            isUploading={isUploading}
            label={language === "en" ? "Profile Photo" : "Photo de profil"}
          />
        </div>

        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className={`w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors ${
              isSubmitting || isUploading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? (
              <span>{language === "en" ? "Uploading Image..." : "Téléchargement de l image..."}</span>
            ) : isSubmitting ? (
              <span>{language === "en" ? "Submitting..." : "Soumission..."}</span>
            ) : (
              <span>{language === "en" ? "Submit Registration" : "Soumettre l'inscription"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  placeholder,
  maxLength,
  onBlur,
}: {
  label: React.ReactNode
  value: string
  onChange: (val: string) => void
  type?: string
  required?: boolean
  min?: string
  placeholder?: string
  maxLength?: number
  onBlur?: () => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: React.ReactNode
  value: string
  options: { [key: string]: string }
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        required
      >
        {Object.entries(options).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
