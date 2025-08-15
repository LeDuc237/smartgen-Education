import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { Plus, X, Trash2 } from "lucide-react"
import { useTranslation } from "../../context/TranslationContext"
import { createTeacher, getCompanyInfo } from "../../lib/api"
import { uploadToImgBB, ImageUploadError } from "../../lib/imageUpload"
import ImageUpload from "../../components/ImageUpload"
import bcrypt from "bcryptjs"
import { useQuery } from "@tanstack/react-query"

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
  available_days: string[]
  years_experience: string
  profile_image_url: string
}

export default function TeacherRegister() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: companyInfo } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: getCompanyInfo,
  })

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
    available_days: [],
    years_experience: "",
    profile_image_url: "",
  })

  const [customSubject, setCustomSubject] = useState("")
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false)
  const [customLocation, setCustomLocation] = useState("")
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false)

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

    if (!formData.email || !formData.user || formData.subjects.length === 0) {
      toast.error(
        language === "en" ? "Please fill in all required fields." : "Veuillez remplir tous les champs obligatoires.",
      )
      return
    }

    if (formData.password.length < 4) {
      toast.error(language === "en" ? "Password too short." : "Mot de passe trop court.")
      return
    }

    setIsSubmitting(true)
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

    try {
      const hashedPassword = await bcrypt.hash(formData.password, 10)
      const payload = {
        ...formData,
        password: hashedPassword,
        profile_image_url: imageUrl,
      }

      await createTeacher(payload, language)

      toast.success(
        language === "en"
          ? "Your information has been sent to the administration for verification. You will receive a WhatsApp message once validated."
          : "Vos informations ont été envoyées à l'administration pour vérification. Vous recevrez un message WhatsApp une fois validé.",
        {
          duration: 5000,
          style: {
            borderLeft: "4px solid #10B981",
            backgroundColor: "#F0F9FF",
            padding: "1rem",
            maxWidth: "500px",
            color: "#1E3A8A",
          },
          iconTheme: {
            primary: "#3B82F6",
            secondary: "#FFFFFF",
          },
        },
      )

      navigate("/teacher-login")
    } catch (error: any) {
      toast.error(
        error.message ||
          (language === "en" ? "Failed to register. Please try again." : "Échec de l'inscription. Veuillez réessayer."),
      )
    } finally {
      setIsSubmitting(false)
    }
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

  const handleArrayChange = (field: "subjects" | "available_days" | "location", value: string) => {
    setFormData((prev) => {
      const currentArray = [...prev[field]]
      const index = currentArray.indexOf(value)

      if (index === -1) {
        currentArray.push(value)
      } else {
        currentArray.splice(index, 1)
      }

      return { ...prev, [field]: currentArray }
    })
  }

  const handleAddCustom = (
    field: "subjects" | "location",
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }))
      setValue("")
    }
  }

  const handleRemoveItem = (field: "subjects" | "location", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }))
  }

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "")
    let formatted = cleaned

    if (cleaned.startsWith("237")) {
      formatted = `+${cleaned}`
    } else if (cleaned.length > 0 && !cleaned.startsWith("237")) {
      formatted = `+237${cleaned}`
    }

    setFormData((prev) => ({ ...prev, contact: formatted.slice(0, 13) }))
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center bg-cover bg-center pt-8 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-green-800/90"></div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors"
      >
        <span>{language === "en" ? "Home" : "Accueil"}</span>
      </button>

      <div className="w-full max-w-6xl mx-auto z-10">
        <div className="text-center mb-8 space-y-3">
          {companyInfo?.logo ? (
            <img
              src={companyInfo.logo || "/placeholder.svg"}
              alt="Company Logo"
              className="h-14 w-auto mx-auto object-contain"
            />
          ) : (
            <div className="h-14 w-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {companyInfo?.Name?.charAt(0) || "S"}
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">
            {companyInfo?.Name || (language === "en" ? "Our Company" : "Notre entreprise")}
          </h1>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => navigate("/teacher-login")}
            className="w-full max-w-sm py-3 px-4 text-sm font-medium text-black bg-blue-400 hover:bg-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            {language === "en" ? "Already a Teacher? Login here" : "Déjà enseignant ? Connectez-vous ici"}
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {language === "en" ? "Teacher Registration" : "Inscription Enseignant"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {language === "en" ? "WhatsApp Phone Number" : "Numéro de téléphone WhatsApp"} <RequiredStar />
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
                  {language === "en" ? "Subjects Taught" : "Matières enseignées"}{" "}
                  <span className="text-red-500">*</span>
                </label>
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

                <div className="space-y-2">
                  {formData.subjects
                    .filter((subject) => !commonSubjects.includes(subject))
                    .map((subject) => (
                      <div key={subject} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{subject}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem("subjects", subject)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
                        onClick={() => {
                          handleAddCustom("subjects", customSubject, setCustomSubject)
                          setShowCustomSubjectInput(false)
                        }}
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

              {/* Locations Field */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Teaching Locations" : "Lieux d'enseignement"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                  {commonLocations.map((location) => (
                    <div key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${location}`}
                        checked={formData.location.includes(location)}
                        onChange={() => handleArrayChange("location", location)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`location-${location}`} className="ml-2 text-sm text-gray-700">
                        {location}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {formData.location
                    .filter((location) => !commonLocations.includes(location))
                    .map((location) => (
                      <div key={location} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{location}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem("location", location)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
                        placeholder={language === "en" ? "Enter location" : "Entrez un lieu"}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleAddCustom("location", customLocation, setCustomLocation)
                          setShowCustomLocationInput(false)
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={!customLocation.trim()}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomLocationInput(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomLocationInput(true)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                    >
                      <Plus size={14} />
                      {language === "en" ? "Add custom location" : "Ajouter un lieu personnalisé"}
                    </button>
                  )}
                </div>
              </div>

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
                  <span>{language === "en" ? "Uploading Image..." : "Téléchargement de l'image..."}</span>
                ) : isSubmitting ? (
                  <span>{language === "en" ? "Submitting..." : "Soumission..."}</span>
                ) : (
                  <span>{language === "en" ? "Submit Registration" : "Soumettre l'inscription"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Reusable components
function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  placeholder,
  maxLength,
}: {
  label: React.ReactNode
  value: string
  onChange: (val: string) => void
  type?: string
  required?: boolean
  min?: string
  placeholder?: string
  maxLength?: number
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
