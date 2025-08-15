import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import {
  Users,
  Calendar,
  CreditCard,
  UserCircle,
  LogOut,
  BookOpen,
  Star,
  Clock,
  MapPin,
  MessageSquare,
  Check,
  Hash,
  Globe,
  Award,
  TrendingUp,
  Download,
  Phone,
  Mail,
  GraduationCap,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from "lucide-react"
import { useAuthStore } from "../store/authStore"
import { useTranslation } from "../context/TranslationContext"
import { getStudentProfile, getStudentPayments, getTeacherComments, createTeacherComment } from "../lib/api"
import { getCategoryInfo } from "../lib/utils"

// Constants
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WEEK_DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

// Navigation items
const NAV_ITEMS = [
  { key: "profile", labelEn: "Profile", labelFr: "Profil", icon: UserCircle },
  { key: "schedule", labelEn: "Schedule", labelFr: "Horaire", icon: Calendar },
  { key: "teachers", labelEn: "Teachers", labelFr: "Enseignants", icon: Users },
  { key: "payments", labelEn: "Payments", labelFr: "Paiements", icon: CreditCard },
]

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<"profile" | "schedule" | "payments" | "teachers">("profile")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, role, signOut } = useAuthStore()
  const { language, toggleLanguage } = useTranslation()

  // PDF Generation Functions
  const downloadTeacherInfoAsPDF = async (teacher: any) => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // PDF Header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(language === "en" ? "Teacher Information" : "Informations de l'Enseignant", 20, 30)

      // Student info
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`${language === "en" ? "Student:" : "Étudiant:"} ${profile?.full_name}`, 20, 45)
      doc.text(`${language === "en" ? "Downloaded on:" : "Téléchargé le:"} ${new Date().toLocaleDateString()}`, 20, 55)

      // Teacher details
      let yPosition = 75
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text( `${language === "en" ? "Name of Teacher:" : "Nom de L'enseignant:"} ${teacher.full_name}` , 20, yPosition)

      // Contact information
      yPosition += 15
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`${language === "en" ? "Email:" : "Email:"} ${teacher.email}`, 20, yPosition)
      yPosition += 10
      doc.text(`${language === "en" ? "Phone:" : "Téléphone:"} ${teacher.contact}`, 20, yPosition)
      yPosition += 10
      doc.text(
        `${language === "en" ? "Experience:" : "Expérience:"} ${teacher.years_experience} ${language === "en" ? "years" : "ans"}`,
        20,
        yPosition,
      )
      yPosition += 10
      doc.text(`${language === "en" ? "Diploma:" : "Diplôme:"} ${teacher.highest_diploma}`, 20, yPosition)
      yPosition += 15

      // Subjects
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text(language === "en" ? "Subjects:" : "Matières:", 20, yPosition)
      yPosition += 10
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)

      if (teacher.subjects && teacher.subjects.length > 0) {
        const subjectsText = Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects
        const splitSubjects = doc.splitTextToSize(subjectsText, 170)
        doc.text(splitSubjects, 20, yPosition)
        yPosition += splitSubjects.length * 7
      }

      yPosition += 10

      // Locations
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text(language === "en" ? "Teaching Locations:" : "Lieux d'enseignement:", 20, yPosition)
      yPosition += 10
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)

      if (teacher.location && teacher.location.length > 0) {
        const locationsText = teacher.location.join(", ")
        const splitLocations = doc.splitTextToSize(locationsText, 170)
        doc.text(splitLocations, 20, yPosition)
        yPosition += splitLocations.length * 7
      }

      yPosition += 10

      // Available days
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text(language === "en" ? "Available Days:" : "Jours disponibles:", 20, yPosition)
      yPosition += 10
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)

      if (teacher.available_days && teacher.available_days.length > 0) {
        const daysText = teacher.available_days.join(", ")
        doc.text(daysText, 20, yPosition)
        yPosition += 15
      }

      // About section
      if (teacher.about_me) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text(language === "en" ? "About:" : "À propos:", 20, yPosition)
        yPosition += 10
        doc.setFontSize(12)
        doc.setTextColor(60, 60, 60)

        const aboutText = doc.splitTextToSize(teacher.about_me, 170)
        doc.text(aboutText, 20, yPosition)
        yPosition += aboutText.length * 7
      }

      // Rating
      yPosition += 10
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text(
        `${language === "en" ? "Rating:" : "Note:"} ${teacher.rating?.toFixed(1) || "N/A"}/5 (${teacher.number_reviews || 0} ${language === "en" ? "reviews" : "avis"})`,
        20,
        yPosition,
      )

      doc.save(`teacher-${teacher.full_name.replace(/\s+/g, "-").toLowerCase()}-info.pdf`)

      toast.success(
        language === "en"
          ? "Teacher information downloaded as PDF!"
          : "Informations de l'enseignant téléchargées en PDF!",
      )
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error(
        language === "en"
          ? "Failed to generate PDF. Please try again."
          : "Échec de la génération du PDF. Veuillez réessayer.",
      )
    }
  }

  const downloadAllTeachersInfoAsPDF = async () => {
    if (!studentProfile?.teachers || studentProfile.teachers.length === 0) {
      toast.error(language === "en" ? "No teachers found to download" : "Aucun enseignant trouvé à télécharger")
      return
    }

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // PDF Header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(language === "en" ? "All Teachers Information" : "Informations de Tous les Enseignants", 20, 30)

      // Student info
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`${language === "en" ? "Student:" : "Étudiant:"} ${studentProfile.full_name}`, 20, 45)
      doc.text(`${language === "en" ? "Student ID:" : "ID Étudiant:"} ${studentProfile.identifier}`, 20, 55)
      doc.text(`${language === "en" ? "Downloaded on:" : "Téléchargé le:"} ${new Date().toLocaleDateString()}`, 20, 65)
      doc.text(
        `${language === "en" ? "Total Teachers:" : "Total Enseignants:"} ${studentProfile.teachers.length}`,
        20,
        75,
      )

      let yPosition = 95

      // Teacher list
      studentProfile.teachers.forEach((teacher, index) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        // Teacher name
        doc.setFontSize(16)
        doc.setTextColor(40, 40, 40)
        doc.text(`${index + 1}. ${language === "en" ? "Name:" : "Nom:"} ${teacher.full_name}`, 20, yPosition)
        yPosition += 15

        // Teacher details
        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)
        doc.text(`${language === "en" ? "Email:" : "Email:"} ${teacher.email}`, 25, yPosition)
        yPosition += 8
        doc.text(`${language === "en" ? "Phone:" : "Téléphone:"} ${teacher.contact}`, 25, yPosition)
        yPosition += 8
        doc.text(
          `${language === "en" ? "Experience:" : "Expérience:"} ${teacher.years_experience} ${language === "en" ? "years" : "ans"}`,
          25,
          yPosition,
        )
        yPosition += 8

        // Subjects
        if (teacher.subjects && teacher.subjects.length > 0) {
          const subjectsText = Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects
          const splitSubjects = doc.splitTextToSize(
            `${language === "en" ? "Subjects:" : "Matières:"} ${subjectsText}`,
            170,
          )
          doc.text(splitSubjects, 25, yPosition)
          yPosition += splitSubjects.length * 6
        }

        // Rating
        doc.text(`${language === "en" ? "Rating:" : "Note:"} ${teacher.rating?.toFixed(1) || "N/A"}/5`, 25, yPosition)
        yPosition += 15

        // Divider between teachers
        if (index < studentProfile.teachers.length - 1) {
          doc.setDrawColor(200, 200, 200)
          doc.line(20, yPosition, 190, yPosition)
          yPosition += 10
        }
      })

      doc.save(`all-teachers-info-${studentProfile.identifier}.pdf`)

      toast.success(
        language === "en"
          ? "All teachers information downloaded as PDF!"
          : "Toutes les informations des enseignants téléchargées en PDF!",
      )
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error(
        language === "en"
          ? "Failed to generate PDF. Please try again."
          : "Échec de la génération du PDF. Veuillez réessayer.",
      )
    }
  }

  // Data fetching
  const { data: studentProfile } = useQuery({
    queryKey: ["studentProfile", profile?.user],
    queryFn: () => getStudentProfile(profile!.user),
    enabled: !!profile && role === "student",
    onSuccess: (data) => {
      setSelectedDays(data.available_days || [])
    },
  })

  const { data: payments } = useQuery({
    queryKey: ["studentPayments", profile?.id],
    queryFn: () => getStudentPayments(profile!.id),
    enabled: !!profile && role === "student",
  })

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: ({
      teacherId,
      content,
      rating,
    }: {
      teacherId: string
      content: string
      rating: number
    }) => createTeacherComment(teacherId, profile!.id, content, rating),
    onSuccess: (_, variables) => {
      toast.success(language === "en" ? "Comment submitted!" : "Commentaire soumis !")
      setCommentText((prev) => ({ ...prev, [variables.teacherId]: "" }))
      setRatings((prev) => ({ ...prev, [variables.teacherId]: 0 }))
      queryClient.invalidateQueries(["teacherComments"])
    },
    onError: () => {
      toast.error(language === "en" ? "Failed to submit comment" : "Échec de la soumission du commentaire")
    },
  })

  // Authentication guard
  useEffect(() => {
    if (!profile || role !== "student") navigate("/login")
  }, [profile, role, navigate])

  // Handlers
  const handleLogout = async () => {
    try {
      await signOut()
      navigate("/login")
    } catch (error) {
      toast.error(language === "en" ? "Failed to log out" : "Échec de la déconnexion")
    }
  }

  const toggleDay = (day: string) => {
    const maxDays = studentProfile?.days_per_week || 3

    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else if (prev.length < maxDays) {
        return [...prev, day]
      } else {
        toast.error(
          language === "en"
            ? `You can only select ${maxDays} days`
            : `Vous ne pouvez sélectionner que ${maxDays} jours`,
        )
        return prev
      }
    })
  }

  const handleCommentSubmit = (teacherId: string) => {
    const content = commentText[teacherId]?.trim()
    const rating = ratings[teacherId] || 0

    if (!content) {
      toast.error(language === "en" ? "Comment cannot be empty" : "Le commentaire ne peut être vide")
      return
    }

    if (rating === 0) {
      toast.error(language === "en" ? "Please select a rating" : "Veuillez sélectionner une note")
      return
    }

    commentMutation.mutate({ teacherId, content, rating })
  }

  if (!profile || role !== "student") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Profile info */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-base md:text-lg border-2 border-white/30">
                {profile.full_name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div>
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                  {language === "en" ? "Welcome back, " : "Bon retour, "}
                  <span className="text-blue-100">{profile.full_name}</span>
                </h1>
                <p className="text-blue-100 text-xs md:text-sm">
                  {language === "en" ? "Student Dashboard" : "Tableau de bord étudiant"}
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

              {/* Logout (desktop) */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 md:px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{language === "en" ? "Logout" : "Déconnexion"}</span>
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
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all"
                >
                  <LogOut size={18} />
                  {language === "en" ? "Logout" : "Déconnexion"}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50">
          {NAV_ITEMS.map(({ key, labelEn, labelFr, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as typeof activeTab)
                setMobileMenuOpen(false)
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium mt-1">{language === "en" ? labelEn : labelFr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className={`${mobileMenuOpen ? "block" : "hidden"} lg:block lg:w-1/4`}>
            <nav className="bg-white rounded-xl shadow-lg p-4 md:p-6 space-y-3 border border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                {language === "en" ? "Navigation" : "Navigation"}
              </h3>
              {NAV_ITEMS.map(({ key, labelEn, labelFr, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key as typeof activeTab)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl transition-all duration-200 group ${
                    activeTab === key
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={activeTab === key ? "text-white" : "text-blue-600"} />
                    <div className="text-left">
                      <div className="font-semibold text-sm md:text-base">
                        {language === "en" ? labelEn : labelFr}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            {studentProfile && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">
                  {language === "en" ? "Quick Stats" : "Statistiques rapides"}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">{language === "en" ? "Teachers" : "Enseignants"}</span>
                    </div>
                    <span className="font-bold text-blue-600">{studentProfile.teachers?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">{language === "en" ? "Payments" : "Paiements"}</span>
                    </div>
                    <span className="font-bold text-green-600">{payments?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">{language === "en" ? "Days/Week" : "Jours/Semaine"}</span>
                    </div>
                    <span className="font-bold text-purple-600">{studentProfile.days_per_week}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === "profile" && studentProfile && (
              <div className="space-y-6">
                {/* Student Profile Header */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${getCategoryInfo(studentProfile.categories).gradient} p-8 text-white`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl font-bold">{studentProfile.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2">{studentProfile.full_name}</h2>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <Hash size={16} />
                            <span className="font-mono text-sm">{studentProfile.identifier}</span>
                          </div>
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getCategoryInfo(studentProfile.categories).color}`}
                          >
                            <Globe size={14} />
                            <span className="text-xs font-medium">
                              {getCategoryInfo(studentProfile.categories).icon}{" "}
                              {getCategoryInfo(studentProfile.categories).label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <MapPin size={16} />
                          <span>{studentProfile.quarter}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Class Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-800">{language === "en" ? "Class" : "Classe"}</h4>
                        </div>
                        <p className="text-xl font-bold text-blue-700">{studentProfile.class}</p>
                      </div>

                      {/* Guardian Information */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-800">{language === "en" ? "Guardian" : "Tuteur"}</h4>
                        </div>
                        <p className="font-bold text-green-700 mb-1">{studentProfile.guardian_name}</p>
                        <p className="text-sm text-green-600">{studentProfile.guardian_phone}</p>
                      </div>

                      {/* Study Schedule */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-800">{language === "en" ? "Schedule" : "Horaire"}</h4>
                        </div>
                        <p className="text-xl font-bold text-purple-700">
                          {studentProfile.days_per_week} {language === "en" ? "days/week" : "jours/semaine"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Award className="w-8 h-8 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-600">{language === "en" ? "Teachers" : "Enseignants"}</p>
                          <p className="text-lg font-bold text-gray-800">{studentProfile.teachers?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">{language === "en" ? "Payments" : "Paiements"}</p>
                          <p className="text-lg font-bold text-gray-800">{payments?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Clock className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">{language === "en" ? "Active Since" : "Actif Depuis"}</p>
                          <p className="text-lg font-bold text-gray-800">
                            {new Date(studentProfile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <section className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === "en" ? "Class Schedule" : "Horaire des cours"}
                  </h2>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="text-blue-600" size={24} />
                    <p className="text-blue-800 font-semibold text-lg">
                      {language === "en"
                        ? `You selected ${studentProfile?.days_per_week || 3} days per week`
                        : `Vous avez choisi ${studentProfile?.days_per_week || 3} jours par semaine`}
                    </p>
                  </div>
                  <p className="text-blue-600">
                    {language === "en"
                      ? "Select your preferred days for classes:"
                      : "Sélectionnez vos jours préférés pour les cours:"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {(language === "en" ? WEEK_DAYS : WEEK_DAYS_FR).map((day, index) => {
                    const englishDay = WEEK_DAYS[index]
                    return (
                      <button
                        key={englishDay}
                        onClick={() => toggleDay(englishDay)}
                        disabled={
                          selectedDays.length >= (studentProfile?.days_per_week || 3) &&
                          !selectedDays.includes(englishDay)
                        }
                        className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                          selectedDays.includes(englishDay)
                            ? "bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg transform scale-105"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {selectedDays.includes(englishDay) && <Check size={18} />}
                        <span className="text-sm">{day}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedDays.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {language === "en" ? "Selected Days:" : "Jours sélectionnés:"}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedDays.map((day) => {
                        const dayIndex = WEEK_DAYS.indexOf(day)
                        const displayDay = language === "en" ? day : WEEK_DAYS_FR[dayIndex]
                        return (
                          <span
                            key={day}
                            className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-md"
                          >
                            {displayDay}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Teachers Tab */}
            {activeTab === "teachers" && studentProfile?.teachers && (
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {language === "en" ? "My Teachers" : "Mes enseignants"}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        {language === "en"
                          ? `${studentProfile.teachers.length} teacher(s) assigned`
                          : `${studentProfile.teachers.length} enseignant(s) assigné(s)`}
                      </p>
                    </div>
                  </div>

                  {studentProfile.teachers.length > 0 && (
                    <button
                      onClick={downloadAllTeachersInfoAsPDF}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      <FileText size={18} />
                      <span className="font-medium">
                        {language === "en" ? "Download teacher info as PDF" : "Télécharger les info des enseignant en PDF"}
                      </span>
                    </button>
                  )}
                </div>

                {studentProfile.teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    {/* Teacher Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-shrink-0">
                          {teacher.profile_image_url ? (
                            <img
                              src={teacher.profile_image_url || "/placeholder.svg"}
                              alt={teacher.full_name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg border-4 border-white">
                              {teacher.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{teacher.full_name}</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail size={16} className="text-blue-500" />
                              <span className="text-sm">{teacher.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={16} className="text-green-500" />
                              <span className="text-sm">{teacher.contact}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin size={16} className="text-red-500" />
                              <span className="text-sm">{teacher.location?.join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <GraduationCap size={16} className="text-purple-500" />
                              <span className="text-sm">{teacher.highest_diploma}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {teacher.subjects?.map((subject) => (
                              <span
                                key={subject}
                                className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium border border-indigo-200"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={18}
                                  fill={star <= Math.floor(teacher.rating ?? 4) ? "currentColor" : "none"}
                                />
                              ))}
                              <span className="text-gray-700 ml-2 font-medium">
                                {teacher.success_rate?.toFixed(1)} ({teacher.number_reviews}{" "}
                                {language === "en" ? "reviews" : "avis"})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                           <button
                            onClick={() => downloadTeacherInfoAsPDF(teacher)}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md"
                          >
                            <FileText size={16} />
                            <span className="text-sm font-medium">
                              {language === "en" ? "Download PDF" : "Telecharger PDF"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Details */}
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <UserCircle size={20} className="text-blue-600" />
                          {language === "en" ? "About the Teacher" : "À propos du professeur"}
                        </h4>
                        <p className="text-gray-600 mb-6 leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {teacher.about_me ||
                            (language === "en" ? "No description provided" : "Aucune description fournie")}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-5 h-5 text-blue-600" />
                              <p className="text-sm text-blue-600 font-medium">
                                {language === "en" ? "Experience" : "Expérience"}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-blue-700">
                              {teacher.years_experience} {language === "en" ? "years" : "ans"}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-green-600 font-medium">
                                {language === "en" ? "Available Days" : "Jours disponibles"}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-green-700">
                              {teacher.available_days?.length || 0} {language === "en" ? "days" : "jours"}
                            </p>
                          </div>
                        </div>

                        {/* Available Days Display */}
                        {teacher.available_days && teacher.available_days.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-700 mb-2">
                              {language === "en" ? "Available Days:" : "Jours disponibles:"}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {teacher.available_days.map((day) => (
                                <span
                                  key={day}
                                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comment Section */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <MessageSquare size={20} className="text-purple-600" />
                          {language === "en" ? "Your Feedback" : "Votre Avis"}
                        </h4>

                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRatings((prev) => ({ ...prev, [teacher.id]: star }))}
                                className="text-amber-400 hover:text-amber-500 transition-colors"
                              >
                                <Star size={24} fill={star <= (ratings[teacher.id] || 0) ? "currentColor" : "none"} />
                              </button>
                            ))}
                            <span className="text-gray-600 ml-2 font-medium">{ratings[teacher.id] || 0}/5</span>
                          </div>

                          <textarea
                            value={commentText[teacher.id] || ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [teacher.id]: e.target.value }))}
                            placeholder={
                              language === "en" ? "Share your experience..." : "Partagez votre expérience..."
                            }
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
                            disabled={commentMutation.isLoading}
                          />
                        </div>

                        <button
                          onClick={() => handleCommentSubmit(teacher.id)}
                          disabled={commentMutation.isLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-75 disabled:transform-none"
                        >
                          {commentMutation.isLoading
                            ? language === "en"
                              ? "Submitting..."
                              : "Soumission..."
                            : language === "en"
                            ? "Submit Feedback"
                            : "Soumettre un avis"}
                        </button>

                        {/* Previous Comments */}
                        <CommentsSection teacherId={teacher.id} language={language} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && payments && (
              <section className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === "en" ? "Payment History" : "Historique des paiements"}
                  </h2>
                </div>

                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={20} className="text-blue-500" />
                          <p className="font-semibold text-gray-800 text-lg">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-600 mb-1">
                          <span className="font-medium">{language === "en" ? "Teacher:" : "Enseignant:"}</span>{" "}
                          {payment.teachers.full_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={16} />
                          <span>
                            {language === "en" ? "Next due:" : "Prochaine échéance:"}{" "}
                            {new Date(payment.next_payment_due).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-0 lg:text-right">
                        <p className="text-2xl font-bold text-green-600 mb-2">{payment.amount.toLocaleString()} XAF</p>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {language === "en" ? "Paid" : "Payé"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Comments Section Component
function CommentsSection({ teacherId, language }: { teacherId: string; language: string }) {
  const {
    data: comments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacherComments", teacherId],
    queryFn: () => getTeacherComments(teacherId),
  })

  if (isLoading)
    return (
      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
        {language === "en" ? "Loading comments..." : "Chargement des commentaires..."}
      </div>
    )

  if (isError)
    return (
      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-red-500">
        {language === "en" ? "Failed to load comments" : "Échec du chargement des commentaires"}
      </div>
    )

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-4">{language === "en" ? "Recent Feedback" : "Avis récents"}</h4>

      {comments && comments.length > 0 ? (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800">{comment.student.full_name}</p>
                  <div className="flex items-center gap-1 text-amber-400 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} fill={star <= comment.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>
            {language === "en"
              ? "No feedback yet. Be the first to comment!"
              : "Aucun avis pour le moment. Soyez le premier à commenter !"}
          </p>
        </div>
      )}
    </div>
  )
}