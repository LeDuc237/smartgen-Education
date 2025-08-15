import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import {
  Users,
  UserCircle,
  LogOut,
  ChevronDown,
  Globe,
  ChevronUp,
  Edit,
  DollarSign,
  Calendar,
  Phone,
  MapPin,
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Download,
  FileText,
  Mail,
  Menu,
  X,
} from "lucide-react"
import { useTranslation } from "../context/TranslationContext"
import { useAuthStore } from "../store/authStore"
import { getTeacherProfile, getTeacherStudentsWithPayments } from "../lib/api"
import type { Teacher, Student, Payment } from "../lib/types"

export default function TeacherDashboard() {
  const { language, toggleLanguage } = useTranslation()
  const navigate = useNavigate()
  const { profile, role, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState<"profile" | "students" | "analytics">("profile")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    if (!profile || role !== "teacher") {
      navigate("/teacher-login")
    }
  }, [profile, role, navigate])

  // Data fetching
  const { data: teacherProfile, error: profileError } = useQuery({
    queryKey: ["teacherProfile", profile?.user],
    queryFn: () => getTeacherProfile(profile!.user),
    enabled: !!profile && role === "teacher",
  })

  const { data: studentsWithPayments, error: studentsError } = useQuery({
    queryKey: ["teacherStudentsWithPayments", profile?.id],
    queryFn: () => getTeacherStudentsWithPayments(profile!.id),
    enabled: !!profile && role === "teacher",
  })

  // Error handling
  useEffect(() => {
    if (profileError) {
      toast.error(language === "en" ? "Failed to load profile" : "Échec du chargement du profil")
    }
    if (studentsError) {
      toast.error(language === "en" ? "Failed to load students" : "Échec du chargement des étudiants")
    }
  }, [profileError, studentsError, language])

  // Financial calculations
  const { monthlyEarnings, totalStudents, averagePayment, upcomingPayments } = useMemo(() => {
    if (!studentsWithPayments) return { monthlyEarnings: 0, totalStudents: 0, averagePayment: 0, upcomingPayments: 0 }

    const earnings = studentsWithPayments.reduce((total, student) => {
      const studentPayments = student.payments || []
      return total + studentPayments.reduce((sum, payment) => sum + payment.amount, 0)
    }, 0)

    const totalPayments = studentsWithPayments.reduce((total, student) => total + (student.payments?.length || 0), 0)

    const avgPayment = totalPayments > 0 ? earnings / totalPayments : 0

    const upcoming = studentsWithPayments.reduce((count, student) => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      return (
        count +
        (student.payments?.filter((payment) => {
          const nextPaymentDate = new Date(payment.next_payment_due)
          return nextPaymentDate <= nextWeek && nextPaymentDate >= new Date()
        }).length || 0)
      )
    }, 0)

    return {
      monthlyEarnings: earnings,
      totalStudents: studentsWithPayments.length,
      averagePayment: avgPayment,
      upcomingPayments: upcoming,
    }
  }, [studentsWithPayments])

  const dayTranslations = useMemo(
    () => ({
      Monday: language === "en" ? "Monday" : "Lundi",
      Tuesday: language === "en" ? "Tuesday" : "Mardi",
      Wednesday: language === "en" ? "Wednesday" : "Mercredi",
      Thursday: language === "en" ? "Thursday" : "Jeudi",
      Friday: language === "en" ? "Friday" : "Vendredi",
      Saturday: language === "en" ? "Saturday" : "Samedi",
      Sunday: language === "en" ? "Sunday" : "Dimanche",
    }),
    [language],
  )

  if (!profile || role !== "teacher") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
            {language === "en" ? "Welcome back, " : "Bon retour, "}
            <span className="text-blue-100">
              {profile.gender === "female" ? "Mme. " : "Mr. "}
              {profile.full_name}
            </span>
          </h1>
          <p className="text-blue-100 text-xs md:text-sm">
            {language === "en" ? "Teacher Dashboard" : "Tableau de bord enseignant"}
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
          onClick={signOut}
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
            onClick={signOut}
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

      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50">
          {[
            {
              label: "Profile",
              icon: UserCircle,
              key: "profile",
              count: null,
            },
            {
              label: "Students",
              icon: Users,
              key: "students",
              count: totalStudents,
            },
            {
              label: "Analytics",
              icon: TrendingUp,
              key: "analytics",
              count: null,
            },
          ].map(({ label, icon: Icon, key, count }) => (
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
              <span className="text-xs font-medium mt-1">
                {language === "en"
                  ? label
                  : {
                      Profile: "Profil",
                      Students: "Étudiants",
                      Analytics: "Analyses",
                    }[label]}
              </span>
              {count !== null && (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full mt-1 ${
                    activeTab === key ? "bg-blue-100/20 text-blue-50" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className={`${mobileMenuOpen ? "block" : "hidden"} lg:block lg:w-1/4`}>
            <nav className="bg-white rounded-xl shadow-lg p-4 md:p-6 space-y-3 border border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                {language === "en" ? "Navigation" : "Navigation"}
              </h3>
              {[
                {
                  label: "Profile",
                  icon: UserCircle,
                  key: "profile",
                  description: language === "en" ? "View & edit profile" : "Voir et modifier le profil",
                },
                {
                  label: "Students",
                  icon: Users,
                  key: "students",
                  count: totalStudents,
                  description: language === "en" ? "Manage students" : "Gérer les étudiants",
                },
                {
                  label: "Analytics",
                  icon: TrendingUp,
                  key: "analytics",
                  description: language === "en" ? "View performance" : "Voir les performances",
                },
              ].map(({ label, icon: Icon, key, count, description }) => (
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
                        {language === "en"
                          ? label
                          : {
                              Profile: "Profil",
                              Students: "Étudiants",
                              Analytics: "Analyses",
                            }[label]}
                      </div>
                      <div className={`text-xs ${activeTab === key ? "text-blue-100" : "text-gray-500"}`}>
                        {description}
                      </div>
                    </div>
                  </div>
                  {count !== null && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        activeTab === key ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-6 bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">
                {language === "en" ? "Quick Stats" : "Statistiques rapides"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">{language === "en" ? "Students" : "Étudiants"}</span>
                  </div>
                  <span className="font-bold text-blue-600">{totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">{language === "en" ? "Monthly" : "Mensuel"}</span>
                  </div>
                  <span className="font-bold text-green-600 text-xs md:text-sm">
                    {monthlyEarnings.toLocaleString("en-US", {
                      style: "currency",
                      currency: "XAF",
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">{language === "en" ? "Due Soon" : "Bientôt dû"}</span>
                  </div>
                  <span className="font-bold text-orange-600">{upcomingPayments}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && teacherProfile && (
              <TeacherProfileSection
                teacherProfile={teacherProfile}
                language={language}
                dayTranslations={dayTranslations}
                onEdit={() => navigate("/edit-teacher-profile", { state: teacherProfile })}
              />
            )}

            {activeTab === "students" && (
              <StudentsWithPaymentsSection
                students={studentsWithPayments || []}
                language={language}
                monthlyEarnings={monthlyEarnings}
                expandedStudent={expandedStudent}
                setExpandedStudent={setExpandedStudent}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsSection
                students={studentsWithPayments || []}
                language={language}
                monthlyEarnings={monthlyEarnings}
                totalStudents={totalStudents}
                averagePayment={averagePayment}
                upcomingPayments={upcomingPayments}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function TeacherProfileSection({
  teacherProfile,
  language,
  dayTranslations,
  onEdit,
}: {
  teacherProfile: Teacher
  language: "en" | "fr"
  dayTranslations: Record<string, string>
  onEdit: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <button
          onClick={onEdit}
          className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all duration-200 border border-white/20 transform hover:scale-105 shadow-lg"
        >
          <Edit size={16} className="md:w-5 md:h-5" />
          <span className="text-sm md:text-base font-medium">
            {language === "en" ? "Edit Profile" : "Modifier le profil"}
          </span>
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative z-10">
         <div className="flex-shrink-0">
  {teacherProfile.profile_image_url ? (
    <img
      src={teacherProfile.profile_image_url}
      alt={teacherProfile.full_name}
      className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-4 border-white/30"
    />
  ) : (
    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 backdrop-blur-sm flex items-center justify-center text-white text-2xl md:text-3xl font-bold border-4 border-white/30">
      {teacherProfile.full_name.charAt(0).toUpperCase()}
    </div>
  )}
</div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{teacherProfile.full_name}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Mail className="w-4 h-4" />
              <span className="text-blue-100 text-sm md:text-base break-all">{teacherProfile.email}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm rounded-full border border-white/30">
                {teacherProfile.category === "anglo"
                  ? language === "en"
                    ? "Anglophone"
                    : "Anglophone"
                  : language === "en"
                    ? "Francophone"
                    : "Francophone"}
              </span>
              <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm rounded-full border border-white/30">
                {teacherProfile.years_experience} {language === "en" ? "years exp." : "ans exp."}
              </span>
              <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm rounded-full border border-white/30">
                {teacherProfile.success_rate}% {language === "en" ? "success" : "réussite"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            {language === "en" ? "Personal Information" : "Informations personnelles"}
          </h3>
          <div className="space-y-4">
            <ProfileField title={language === "en" ? "About Me" : "À propos"} content={teacherProfile.about_me} />
            <ProfileField
              title={language === "en" ? "Contact" : "Contact"}
              content={teacherProfile.contact}
              icon={<Phone size={16} className="text-gray-400" />}
            />
            <ProfileField
              title={language === "en" ? "Location" : "Localisation"}
              content={teacherProfile.town}
              icon={<MapPin size={16} className="text-red-500" />}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            {language === "en" ? "Teaching Information" : "Informations d'enseignement"}
          </h3>
          <div className="space-y-4">
            <ProfileField
              title={language === "en" ? "Subjects" : "Matières"}
              items={teacherProfile.subjects}
              badgeStyle="bg-purple-100 text-purple-800"
            />
            <ProfileField
              title={language === "en" ? "Available Days" : "Jours disponibles"}
              items={teacherProfile.available_days
                .map((day) => dayTranslations[day])
                .sort((a, b) => Object.values(dayTranslations).indexOf(a) - Object.values(dayTranslations).indexOf(b))}
              badgeStyle="bg-orange-100 text-orange-800"
            />
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700 text-sm md:text-base">
                  {language === "en" ? "Success Rate" : "Taux de Réussite"}
                </span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-green-600">{teacherProfile.success_rate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Students Section
function StudentsWithPaymentsSection({
  students,
  language,
  monthlyEarnings,
  expandedStudent,
  setExpandedStudent,
}: {
  students: Student[]
  language: "en" | "fr"
  monthlyEarnings: number
  expandedStudent: string | null
  setExpandedStudent: (id: string | null) => void
}) {
  const toggleStudent = (studentId: string) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId))
  }

  return (
    <section className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{language === "en" ? "My Students" : "Mes Étudiants"}</h2>
            <p className="text-sm text-gray-500">
              {language === "en" ? "Manage your students and payments" : "Gérez vos étudiants et paiements"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Users className="text-blue-600" size={18} />}
              label={language === "en" ? "Students" : "Étudiants"}
              value={students.length}
              color="blue"
            />

            <StatCard
              icon={<DollarSign className="text-green-600" size={18} />}
              label={language === "en" ? "Monthly" : "Mensuel"}
              value={monthlyEarnings}
              color="green"
              isCurrency
            />
          </div>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              language={language}
              isExpanded={expandedStudent === student.id}
              onToggle={toggleStudent}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="text-gray-400" size={24} />}
          title={language === "en" ? "No students found" : "Aucun étudiant trouvé"}
          message={
            language === "en"
              ? "You currently have no students assigned"
              : "Vous n'avez actuellement aucun étudiant assigné"
          }
        />
      )}
    </section>
  )
}

// Student Card Component
function StudentCard({
  student,
  language,
  isExpanded,
  onToggle,
}: {
  student: Student
  language: "en" | "fr"
  isExpanded: boolean
  onToggle: (id: string) => void
}) {
  const totalPayments = student.payments?.reduce((sum, p) => sum + p.amount, 0) || 0

  return (
    <div>
      <div
        className="flex flex-col md:flex-row items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onToggle(student.id)}
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {student.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{student.full_name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{student.class}</span>
              <span>•</span>
              <span className="truncate">{student.quarter}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0 grid grid-cols-2 md:flex md:gap-6">
          <div className="text-sm">
            <p className="font-medium text-gray-500">{language === "en" ? "Guardian" : "Tuteur"}</p>
            <p className="text-gray-900 truncate">{student.guardian_name}</p>
            <a href={`tel:${student.guardian_phone}`} className="text-blue-600 hover:underline text-sm">
              {student.guardian_phone}
            </a>
          </div>

          <div className="text-sm">
            <p className="font-medium text-gray-500">{language === "en" ? "Monthly" : "Mensuel"}</p>
            <p className="text-green-600 font-medium">
              {totalPayments.toLocaleString(language === "en" ? "en-US" : "fr-FR", {
                style: "currency",
                currency: "XAF",
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        <div className="md:block text-gray-900 ml-4">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <span>{language === "en" ? "Payment History" : "Historique des paiements"}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {student.payments?.length || 0}
              </span>
            </h4>
            <p className="text-sm font-medium text-green-600">
              {language === "en" ? "Total: " : "Total: "}
              {totalPayments.toLocaleString(language === "en" ? "en-US" : "fr-FR", {
                style: "currency",
                currency: "XAF",
              })}
            </p>
          </div>

          {student.payments?.length > 0 ? (
            <div className="space-y-3">
              {student.payments.map((payment) => (
                <PaymentItem key={payment.id} payment={payment} language={language} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<DollarSign className="text-gray-400" size={24} />}
              title={language === "en" ? "No payments found" : "Aucun paiement trouvé"}
              message={
                language === "en"
                  ? "No payment history for this student"
                  : "Aucun historique de paiement pour cet étudiant"
              }
              small
            />
          )}
        </div>
      )}
    </div>
  )
}

// Reusable Components
function ProfileField({
  title,
  content,
  items,
  icon,
  badgeStyle,
}: {
  title: string
  content?: string
  items?: string[]
  icon?: React.ReactNode
  badgeStyle?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-gray-700">
        {icon}
        <h4 className="font-bold">{title}</h4>
      </div>
      {content ? (
        <p className="text-gray-600">{content || "N/A"}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items?.length ? (
            items.map((item) => (
              <span
                key={item}
                className={`${badgeStyle || "bg-blue-100 text-blue-800"} px-3 py-1 rounded-full text-sm`}
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">N/A</span>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color = "blue",
  isCurrency = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color?: "blue" | "green"
  isCurrency?: boolean
}) {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-800" },
    green: { bg: "bg-green-50", text: "text-green-800" },
  }

  return (
    <div className={`${colorClasses[color].bg} rounded-lg p-3`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <p className={`text-xl font-bold ${colorClasses[color].text} mt-1`}>
        {isCurrency
          ? value.toLocaleString("en-US", { style: "currency", currency: "XAF", minimumFractionDigits: 0 })
          : value}
      </p>
    </div>
  )
}

function PaymentItem({ payment, language }: { payment: Payment; language: "en" | "fr" }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white rounded-lg shadow-sm gap-2 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2 rounded-full">
          <Calendar className="text-blue-600" size={16} />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {new Date(payment.payment_date).toLocaleDateString(language === "en" ? "en-US" : "fr-FR")}
          </p>
          <p className="text-sm text-gray-600">
            {language === "en" ? "Next due: " : "Prochain dû: "}
            {new Date(payment.next_payment_due).toLocaleDateString(language === "en" ? "en-US" : "fr-FR")}
          </p>
        </div>
      </div>
      <div className="text-green-600 font-bold text-lg">
        {payment.amount.toLocaleString(language === "en" ? "en-US" : "fr-FR", {
          style: "currency",
          currency: "XAF",
        })}
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  message,
  small = false,
}: {
  icon: React.ReactNode
  title: string
  message: string
  small?: boolean
}) {
  return (
    <div className={`p-8 text-center ${small ? "p-4" : "p-8"}`}>
      <div
        className={`mx-auto ${small ? "w-12 h-12" : "w-16 h-16"} bg-gray-100 rounded-full flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className={`font-medium text-gray-900 ${small ? "text-base" : "text-lg"}`}>{title}</h3>
      <p className={`text-gray-500 ${small ? "mt-1 text-sm" : "mt-2"}`}>{message}</p>
    </div>
  )
}

function AnalyticsSection({
  students,
  language,
  monthlyEarnings,
  totalStudents,
  averagePayment,
  upcomingPayments,
}: {
  students: Student[]
  language: "en" | "fr"
  monthlyEarnings: number
  totalStudents: number
  averagePayment: number
  upcomingPayments: number
}) {
  const downloadReport = () => {
    const reportData = {
      teacher: "Teacher Report",
      date: new Date().toLocaleDateString(),
      totalStudents,
      monthlyEarnings,
      averagePayment,
      upcomingPayments,
      students: students.map((student) => ({
        name: student.full_name,
        class: student.class,
        guardian: student.guardian_name,
        phone: student.guardian_phone,
        totalPayments: student.payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
      })),
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `teacher-report-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            {language === "en" ? "Performance Analytics" : "Analyses de performance"}
          </h2>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            {language === "en" ? "Download Report" : "Télécharger le rapport"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            icon={<Users className="text-blue-600" size={24} />}
            title={language === "en" ? "Total Students" : "Total Étudiants"}
            value={totalStudents.toString()}
            color="blue"
          />
          <AnalyticsCard
            icon={<DollarSign className="text-green-600" size={24} />}
            title={language === "en" ? "Monthly Earnings" : "Revenus mensuels"}
            value={monthlyEarnings.toLocaleString("en-US", {
              style: "currency",
              currency: "XAF",
              minimumFractionDigits: 0,
            })}
            color="green"
          />
          <AnalyticsCard
            icon={<TrendingUp className="text-purple-600" size={24} />}
            title={language === "en" ? "Avg Payment" : "Paiement moyen"}
            value={averagePayment.toLocaleString("en-US", {
              style: "currency",
              currency: "XAF",
              minimumFractionDigits: 0,
            })}
            color="purple"
          />
          <AnalyticsCard
            icon={<Clock className="text-orange-600" size={24} />}
            title={language === "en" ? "Due Soon" : "Bientôt dû"}
            value={upcomingPayments.toString()}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {language === "en" ? "Student Distribution" : "Répartition des étudiants"}
            </h3>
            <div className="space-y-3">
              {students.slice(0, 5).map((student, index) => (
                <div key={student.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                      {student.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-700">{student.full_name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{student.class}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {language === "en" ? "Recent Activity" : "Activité récente"}
            </h3>
            <div className="space-y-3">
              {students.slice(0, 5).map((student) => {
                const totalPayments = student.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
                return (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{student.full_name}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {totalPayments.toLocaleString("en-US", {
                        style: "currency",
                        currency: "XAF",
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  color: "blue" | "green" | "purple" | "orange"
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
  }

  return (
    <div className={`${colorClasses[color]} rounded-lg p-6 border`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-medium text-gray-700">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
