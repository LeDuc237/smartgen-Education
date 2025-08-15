"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  User,
  MapPin,
  Calendar,
  BookOpen,
  Clock,
  Users,
  Star,
  MessageCircle,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { deleteTeacher, approveTeacher, rejectTeacher } from "../../../lib/api"
import { useAuthStore } from "../../../store/authStore"
import type { Teacher } from "../../../lib/types"

interface TeacherManagementProps {
  teachers: Teacher[]
  language: "en" | "fr"
}

export default function TeacherManagement({ teachers, language }: TeacherManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending")
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const teachersPerPage = 6

  // Check permissions - only promoteur and chef coordonateur can manage teachers
  const canManageTeachers = profile?.role === "promoteur" || profile?.role === "chef coordonateur"

  // Sort teachers by creation and update date for pending/approved, by success rate for all
  const getSortedTeachers = () => {
    if (activeTab === "all") {
      return [...teachers].sort((a, b) => {
        const successRateA = a.success_rate || 0
        const successRateB = b.success_rate || 0
        return successRateB - successRateA // Highest success rate first
      })
    } else {
      return [...teachers].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA // Newest first
      })
    }
  }

  const sortedTeachers = getSortedTeachers()

  const filteredTeachers = sortedTeachers
    .filter((teacher) => {
      if (activeTab === "pending") return !teacher.is_approved
      if (activeTab === "approved") return teacher.is_approved
      return true // 'all' tab shows all teachers
    })
    .filter(
      (teacher) =>
        searchQuery === "" ||
        teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subjects?.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (teacher.location && teacher.location.join(", ").toLowerCase().includes(searchQuery.toLowerCase())),
    )

  // Pagination logic
  const indexOfLastTeacher = currentPage * teachersPerPage
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher)
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage)

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!canManageTeachers) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can delete teachers"
          : "Seuls le promoteur et le chef coordonateur peuvent supprimer des enseignants",
      )
      return
    }

    if (
      window.confirm(
        language === "en"
          ? "Are you sure you want to delete this teacher?"
          : "Êtes-vous sûr de vouloir supprimer cet enseignant ?",
      )
    ) {
      try {
        await deleteTeacher(teacherId)
        toast.success(language === "en" ? "Teacher deleted successfully" : "Enseignant supprimé avec succès")
      } catch (error) {
        toast.error(language === "en" ? "Failed to delete teacher" : "Échec de la suppression de l'enseignant")
      }
    }
  }

  const handleApproveTeacher = async (teacherId: string) => {
    if (!canManageTeachers) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can approve teachers"
          : "Seuls le promoteur et le chef coordonateur peuvent approuver des enseignants",
      )
      return
    }

    try {
      await approveTeacher(teacherId)
      toast.success(language === "en" ? "Teacher approved successfully" : "Enseignant approuvé avec succès")
    } catch (error) {
      toast.error(language === "en" ? "Failed to approve teacher" : "Échec de l'approbation de l'enseignant")
    }
  }

  const handleRejectTeacher = async (teacherId: string) => {
    if (!canManageTeachers) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can reject teachers"
          : "Seuls le promoteur et le chef coordonateur peuvent rejeter des enseignants",
      )
      return
    }

    if (
      window.confirm(
        language === "en"
          ? "Are you sure you want to reject this teacher?"
          : "Êtes-vous sûr de vouloir rejeter cet enseignant ?",
      )
    ) {
      try {
        await rejectTeacher(teacherId)
        toast.success(language === "en" ? "Teacher rejected successfully" : "Enseignant rejeté avec succès")
      } catch (error) {
        toast.error(language === "en" ? "Failed to reject teacher" : "Échec du rejet de l'enseignant")
      }
    }
  }

  const handleEditTeacher = (teacherId: string) => {
    if (!canManageTeachers) {
      toast.error(
        language === "en"
          ? "Only promoteur and chef coordonateur can edit teachers"
          : "Seuls le promoteur et le chef coordonateur peuvent modifier des enseignants",
      )
      return
    }
    navigate(`/admin/edit-teacher/${teacherId}`)
  }

  const handleContactTeacher = (teacher: Teacher) => {
    const message =
      language === "en"
        ? `Hello ${teacher.gender === "male" ? "Mr." : "Mrs./Ms."} ${teacher.full_name},\n\nA family is interested in your services as a home tutor. Are you free to handle the work?\n\nPlease let us know your availability.\n\nBest regards,\nSmartGen Education Team`
        : `Bonjour/Bonsoir ${teacher.gender === "male" ? "M." : "Mme"} ${teacher.full_name},\n\nUne famille est intéressée par vos services en tant que professeur à domicile. Êtes-vous libre pour prendre en charge ce travail ?\n\nVeuillez nous faire savoir votre disponibilité.\n\nCordialement,\nÉquipe SmartGen Education`

    const whatsappUrl = `https://wa.me/${teacher.contact}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const formatWhatsAppMessage = (teacher: Teacher) => {
    const greeting =
      language === "en"
        ? `Hello ${teacher.gender === "male" ? "Mr." : "Mrs./Ms."} ${teacher.full_name},`
        : `Bonjour/Bonsoir ${teacher.gender === "male" ? "M." : "Mme"} ${teacher.full_name},`

    const intro =
      language === "en"
        ? `We have received your teacher application for *SmartGen Education* ✅.\n\nTo complete your registration, please answer the following questions:\n`
        : `Nous avons bien reçu votre demande d'inscription en tant qu'enseignant(e) pour *SmartGen Education* ✅.\n\nPour finaliser votre inscription, veuillez répondre aux questions suivantes :\n`

    const questions =
      language === "en"
        ? `1. CURRENT EMPLOYMENT STATUS\n   ↳ [Briefly describe your current teaching/work situation]\n\n` +
          `2. ABOUT ME SECTION\n   ↳ [Your teaching philosophy & experience]\n   ↳ [Any special skills or certifications]\n\n` +
          `*Important Notes:*\n` +
          `• This information will influence your success rate and how well you match with students.`
        : `1. SITUATION PROFESSIONNELLE ACTUELLE\n   ↳ [Décrivez brièvement votre situation actuelle de travail/enseignement]\n\n` +
          `2. SECTION "À PROPOS DE MOI"\n   ↳ [Votre philosophie d'enseignement et votre expérience]\n   ↳ [Compétences ou certifications particulières]\n\n` +
          `*Notes importantes :*\n` +
          `• Ces informations influencent votre taux de réussite et la qualité de votre mise en relation avec les élèves.`

    return `${greeting}\n\n${intro}${questions}`
  }

  // Show permission notice if user doesn't have management rights
  if (!canManageTeachers) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 md:p-8 text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-yellow-800 mb-3">
              {language === "en" ? "Access Restricted" : "Accès Restreint"}
            </h2>
            <p className="text-sm md:text-base text-yellow-700 max-w-md mx-auto">
              {language === "en"
                ? "Only promoteur and chef coordonateur can manage teachers. Contact your administrator for access."
                : "Seuls le promoteur et le chef coordonateur peuvent gérer les enseignants. Contactez votre administrateur pour l'accès."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title and Stats */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {language === "en" ? "Teacher Management" : "Gestion des Enseignants"}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span>
                    {teachers.filter((t) => !t.is_approved).length} {language === "en" ? "Pending" : "En attente"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>
                    {teachers.filter((t) => t.is_approved).length} {language === "en" ? "Approved" : "Approuvés"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>
                    {teachers.length} {language === "en" ? "Total" : "Total"}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  language === "en"
                    ? "Search teachers by name, subject, location..."
                    : "Rechercher par nom, matière, localisation..."
                }
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => {
                setActiveTab("pending")
                setCurrentPage(1)
              }}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "pending"
                  ? "bg-orange-500 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === "en" ? "Pending Approval" : "En attente d'approbation"}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === "pending" ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {teachers.filter((t) => !t.is_approved).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("approved")
                setCurrentPage(1)
              }}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "approved"
                  ? "bg-green-500 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {language === "en" ? "Approved Teachers" : "Enseignants Approuvés"}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === "approved" ? "bg-green-600 text-white" : "bg-green-100 text-green-800"
                  }`}
                >
                  {teachers.filter((t) => t.is_approved).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("all")
                setCurrentPage(1)
              }}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "all"
                  ? "bg-blue-500 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {language === "en" ? "All Teachers" : "Tous les Enseignants"}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === "all" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {teachers.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Teachers Grid - 2 columns on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {currentTeachers.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === "en" ? "No teachers found" : "Aucun enseignant trouvé"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? language === "en"
                      ? "Try adjusting your search criteria"
                      : "Essayez d'ajuster vos critères de recherche"
                    : language === "en"
                      ? "No teachers in this category yet"
                      : "Aucun enseignant dans cette catégorie pour le moment"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {language === "en" ? "Clear search" : "Effacer la recherche"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            currentTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Teacher Header */}
                <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm md:text-lg">
                          {teacher.full_name.charAt(0)}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white ${
                            teacher.is_approved ? "bg-green-400" : "bg-orange-400"
                          }`}
                        ></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-lg truncate">{teacher.full_name}</h3>
                        <p className="text-xs md:text-sm text-gray-500 truncate">{teacher.email}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        teacher.is_approved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {teacher.is_approved
                        ? language === "en"
                          ? "Approved"
                          : "Approuvé"
                        : language === "en"
                          ? "Pending"
                          : "En attente"}
                    </div>
                  </div>

                  {/* Teacher Info */}
                  <div className="space-y-2 md:space-y-3">
                    {/* Success Rate */}
                    {teacher.success_rate !== null && teacher.success_rate !== undefined && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
                          <span className="hidden sm:inline">{language === "en" ? "Success" : "Réussite"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 md:w-16 bg-gray-200 rounded-full h-1.5 md:h-2">
                            <div
                              className="bg-green-500 h-1.5 md:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(teacher.success_rate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs md:text-sm font-medium text-green-600">{teacher.success_rate}%</span>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-start gap-1 md:gap-2">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs md:text-sm text-gray-600 min-w-0">
                        <div className="font-medium truncate">{teacher.town || "N/A"}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {teacher.location?.slice(0, 1).join(", ")}
                          {teacher.location && teacher.location.length > 1 && ` +${teacher.location.length - 1}`}
                        </div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="flex items-start gap-1 md:gap-2">
                      <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects?.slice(0, 2).map((subject) => (
                            <span
                              key={subject}
                              className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium truncate"
                            >
                              {subject.length > 8 ? `${subject.substring(0, 8)}...` : subject}
                            </span>
                          ))}
                          {teacher.subjects?.length > 2 && (
                            <span className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
                              +{teacher.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center gap-1 md:gap-2">
                      <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                      <a
                        href={`https://wa.me/${teacher.contact}?text=${encodeURIComponent(formatWhatsAppMessage(teacher))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs md:text-sm text-green-600 hover:text-green-800 font-medium transition-colors truncate"
                      >
                        {teacher.contact}
                      </a>
                    </div>

                    {/* Registration Date */}
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">
                        {language === "en" ? "Reg." : "Inscr."}{" "}
                        {new Date(teacher.created_at).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1 md:space-x-2">
                      {activeTab === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveTeacher(teacher.id)}
                            className="p-1.5 md:p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title={language === "en" ? "Approve Teacher" : "Approuver l'enseignant"}
                          >
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                          <button
                            onClick={() => handleRejectTeacher(teacher.id)}
                            className="p-1.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title={language === "en" ? "Reject Teacher" : "Rejeter l'enseignant"}
                          >
                            <XCircle className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </>
                      )}
                      {(activeTab === "approved" || activeTab === "all") && teacher.is_approved && (
                        <button
                          onClick={() => handleContactTeacher(teacher)}
                          className="p-1.5 md:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title={language === "en" ? "Contact Teacher" : "Contacter l'enseignant"}
                        >
                          <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTeacher(teacher.id)}
                        className="p-1.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title={language === "en" ? "Edit Teacher" : "Modifier l'enseignant"}
                      >
                        <Edit className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="p-1.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title={language === "en" ? "Delete Teacher" : "Supprimer l'enseignant"}
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTeachers.length > teachersPerPage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                {language === "en"
                  ? `Showing ${indexOfFirstTeacher + 1} to ${Math.min(indexOfLastTeacher, filteredTeachers.length)} of ${filteredTeachers.length} teachers`
                  : `Affichage de ${indexOfFirstTeacher + 1} à ${Math.min(indexOfLastTeacher, filteredTeachers.length)} sur ${filteredTeachers.length} enseignants`}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {language === "en" ? "Previous" : "Précédent"}
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {language === "en" ? "Next" : "Suivant"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
