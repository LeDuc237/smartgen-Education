import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  Phone,
  MapPin,
  GraduationCap,
  Eye,
  DollarSign,
  Calendar,
  X,
  Hash,
  Globe,
} from "lucide-react"
import type { Student, Teacher, StudentTeacherRelation, Payment } from "../../../lib/types"
import { deleteStudent, exportStudentsData } from "../../../lib/api"

interface StudentManagementProps {
  students: Student[]
  studentTeachers: StudentTeacherRelation[]
  payments: Payment[]
  teachers: Teacher[]
  language: string
}

export default function StudentManagement({
  students,
  studentTeachers,
  payments,
  teachers,
  language,
}: StudentManagementProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null)

  const studentsPerPage = 3

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesClass = !filterClass || student.class === filterClass
      const matchesCategory = !filterCategory || student.categories === filterCategory
      return matchesSearch && matchesClass && matchesCategory
    })
  }, [students, searchTerm, filterClass, filterCategory])

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
  const startIndex = (currentPage - 1) * studentsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage)

  // Reset pagination when search changes
  useState(() => {
    setCurrentPage(1)
  }, [searchTerm, filterClass, filterCategory])

  // Get unique classes for filter
  const uniqueClasses = [...new Set(students.map((s) => s.class).filter(Boolean))]

  const uniqueCategories = [...new Set(students.map((s) => s.categories).filter(Boolean))]

  const getCategoryInfo = (category: "franco" | "anglo" | "bilingue") => {
    const categoryMap = {
      anglo: {
        label: language === "en" ? "Anglophone" : "Anglophone",
        color: "bg-blue-100 text-blue-800",
        icon: "🇬🇧",
      },
      franco: {
        label: language === "en" ? "Francophone" : "Francophone",
        color: "bg-green-100 text-green-800",
        icon: "🇫🇷",
      },
      bilingue: {
        label: language === "en" ? "Bilingual" : "Bilingue",
        color: "bg-purple-100 text-purple-800",
        icon: "🌍",
      },
    }
    return categoryMap[category] || { label: category, color: "bg-gray-100 text-gray-800", icon: "📚" }
  }

  // Helper functions
  const getStudentTeachers = (studentId: string) => {
    const relations = studentTeachers.filter((st) => st.student_id === studentId)
    return relations.map((rel) => teachers.find((t) => t.id === rel.teacher_id)).filter(Boolean)
  }

  const getStudentPayments = (studentId: string) => {
    return payments.filter((p) => p.student_id === studentId)
  }

  const getTotalPaid = (studentId: string) => {
    return getStudentPayments(studentId).reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getTeacherPayments = (studentId: string, teacherId: string) => {
    return payments.filter((p) => p.student_id === studentId && p.teacher_id === teacherId)
  }

  const handleEdit = (studentId: string) => {
    // Navigate to edit student page within admin dashboard
    navigate(`/admin/edit-student/${studentId}`)
  }

  const handleAddStudent = () => {
    // Navigate to add student page within admin dashboard
    navigate("/admin/components/studentadd")
  }

  const handleDelete = async (studentId: string) => {
    if (
      window.confirm(
        language === "en"
          ? "Are you sure you want to delete this student?"
          : "Êtes-vous sûr de vouloir supprimer cet étudiant ?",
      )
    ) {
      try {
        await deleteStudent(studentId)
        toast.success(language === "en" ? "Student deleted successfully" : "Étudiant supprimé avec succès")
        window.location.reload()
      } catch (error) {
        toast.error(language === "en" ? "Failed to delete student" : "Échec de la suppression de l'étudiant")
      }
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportStudentsData()
      toast.success(
        language === "en" ? "Students data exported successfully" : "Données des étudiants exportées avec succès",
      )
    } catch (error) {
      toast.error(language === "en" ? "Failed to export data" : "Échec de l'exportation des données")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "fr-FR")
  }

  // Student Details Modal Component
  const StudentDetailsModal = ({ studentId }: { studentId: string }) => {
    const student = students.find((s) => s.id === studentId)
    const studentTeachersData = getStudentTeachers(studentId)
    const studentPayments = getStudentPayments(studentId)

    if (!student) return null

    const categoryInfo = getCategoryInfo(student.categories)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{student.full_name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{student.full_name}</h2>
                  <p className="text-blue-100">@{student.user}</p>
                  {student.identifier && (
                    <div className="flex items-center gap-2 mt-1">
                      <Hash size={16} />
                      <span className="text-blue-200 font-mono">{student.identifier}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Student Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  {language === "en" ? "Student Information" : "Informations de l'Étudiant"}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Category:" : "Catégorie:"}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Class:" : "Classe:"}</span>
                    <span className="font-medium">{student.class || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Quarter:" : "Quartier:"}</span>
                    <span className="font-medium">{student.quarter || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Days/Week:" : "Jours/Semaine:"}</span>
                    <span className="font-medium">{student.days_per_week || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Phone size={20} className="text-green-500" />
                  {language === "en" ? "Guardian Information" : "Informations du Tuteur"}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Name:" : "Nom:"}</span>
                    <span className="font-medium">{student.guardian_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "en" ? "Phone:" : "Téléphone:"}</span>
                    <a href={`tel:${student.guardian_phone}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {student.guardian_phone || "N/A"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Teachers and Payments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <GraduationCap size={20} className="text-purple-500" />
                {language === "en" ? "Teachers & Payment Details" : "Enseignants et Détails de Paiement"}
              </h3>

              {studentTeachersData.length > 0 ? (
                <div className="space-y-4">
                  {studentTeachersData.map((teacher) => {
                    const teacherPayments = getTeacherPayments(studentId, teacher!.id)
                    const totalPaidToTeacher = teacherPayments.reduce((sum, p) => sum + p.amount, 0)
                    const latestPayment = teacherPayments.sort(
                      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
                    )[0]

                    return (
                      <div key={teacher!.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        {/* Teacher Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{teacher!.full_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{teacher!.full_name}</h4>
                              <p className="text-sm text-gray-600">
                                {Array.isArray(teacher!.subjects) ? teacher!.subjects.join(", ") : teacher!.subjects}
                              </p>
                              <a href={`tel:${teacher!.contact}`} className="text-sm text-blue-600 hover:text-blue-800">
                                {teacher!.contact}
                              </a>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaidToTeacher)}</div>
                            <div className="text-sm text-gray-500">
                              {language === "en" ? "Total Paid" : "Total Payé"}
                            </div>
                          </div>
                        </div>

                        {/* Payment History */}
                        {teacherPayments.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <DollarSign size={16} />
                              {language === "en" ? "Payment History" : "Historique des Paiements"}
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-2 px-3 font-medium text-gray-700">
                                      {language === "en" ? "Date" : "Date"}
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-700">
                                      {language === "en" ? "Amount" : "Montant"}
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-700">
                                      {language === "en" ? "Next Due" : "Prochain"}
                                    </th>
                                    <th className="text-center py-2 px-3 font-medium text-gray-700">
                                      {language === "en" ? "Status" : "Statut"}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {teacherPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="py-2 px-3 flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        {formatDate(payment.payment_date)}
                                      </td>
                                      <td className="text-right py-2 px-3 font-medium text-green-600">
                                        {formatCurrency(payment.amount)}
                                      </td>
                                      <td className="text-right py-2 px-3 text-gray-600">
                                        {payment.next_payment_due ? formatDate(payment.next_payment_due) : "N/A"}
                                      </td>
                                      <td className="text-center py-2 px-3">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                          {language === "en" ? "Paid" : "Payé"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{language === "en" ? "No teachers assigned yet" : "Aucun enseignant assigné pour le moment"}</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{studentTeachersData.length}</div>
                  <div className="text-sm text-gray-600">{language === "en" ? "Teachers" : "Enseignants"}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{studentPayments.length}</div>
                  <div className="text-sm text-gray-600">{language === "en" ? "Payments" : "Paiements"}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalPaid(studentId))}</div>
                  <div className="text-sm text-gray-600">{language === "en" ? "Total Paid" : "Total Payé"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {language === "en" ? "Student Management" : "Gestion des Étudiants"}
              </h1>
              <p className="text-gray-600">
                {language === "en"
                  ? `${filteredStudents.length} students found`
                  : `${filteredStudents.length} étudiants trouvés`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              {isExporting
                ? language === "en"
                  ? "Exporting..."
                  : "Exportation..."
                : language === "en"
                  ? "Export"
                  : "Exporter"}
            </button>

            <button
              onClick={handleAddStudent}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <UserPlus size={16} />
              {language === "en" ? "Add Student" : "Ajouter Étudiant"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={language === "en" ? "Search students..." : "Rechercher des étudiants..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="">{language === "en" ? "All Classes" : "Toutes les Classes"}</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="">{language === "en" ? "All Categories" : "Toutes les Catégories"}</option>
              {uniqueCategories.map((category) => {
                const categoryInfo = getCategoryInfo(category)
                return (
                  <option key={category} value={category}>
                    {categoryInfo.label}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStudents.map((student) => {
          const studentTeachersData = getStudentTeachers(student.id)
          const totalPaid = getTotalPaid(student.id)
          const categoryInfo = getCategoryInfo(student.categories)

          return (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Student Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {student.full_name?.charAt(0)?.toUpperCase() || "S"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{student.full_name}</h3>
                      <p className="text-sm text-gray-500">@{student.user}</p>
                      {student.identifier && (
                        <div className="flex items-center gap-1 mt-1">
                          <Hash size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600 font-mono">{student.identifier}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                    <button
                      onClick={() => setShowDetailsModal(student.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === "en" ? "View Details" : "Voir les Détails"}
                    >
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Student Info */}
                <div className="space-y-3 mb-4">
                  {student.class && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap size={16} className="text-blue-500" />
                      <span className="text-gray-600">{language === "en" ? "Class:" : "Classe:"}</span>
                      <span className="font-medium text-gray-800">{student.class}</span>
                    </div>
                  )}

                  {student.guardian_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-purple-500" />
                      <span className="text-gray-600">{language === "en" ? "Guardian:" : "Tuteur:"}</span>
                      <span className="font-medium text-gray-800">{student.guardian_name}</span>
                    </div>
                  )}

                  {student.guardian_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-green-500" />
                      <span className="font-medium text-gray-800">{student.guardian_phone}</span>
                    </div>
                  )}

                  {student.quarter && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-red-500" />
                      <span className="font-medium text-gray-800">{student.quarter}</span>
                    </div>
                  )}
                </div>

                {/* Teachers */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === "en" ? "Teachers" : "Enseignants"} ({studentTeachersData.length})
                  </h4>
                  {studentTeachersData.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {studentTeachersData.slice(0, 2).map((teacher) => (
                        <span key={teacher?.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {teacher?.full_name}
                        </span>
                      ))}
                      {studentTeachersData.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{studentTeachersData.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      {language === "en" ? "No teachers assigned" : "Aucun enseignant assigné"}
                    </p>
                  )}
                </div>

                {/* Payment Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{language === "en" ? "Total Paid:" : "Total Payé:"}</span>
                    <span className="font-bold text-green-600">{totalPaid.toLocaleString()} XAF</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(student.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Edit size={14} />
                    {language === "en" ? "Edit" : "Modifier"}
                  </button>

                  <button
                    onClick={() => setShowDetailsModal(student.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(student.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {paginatedStudents.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {language === "en" ? "No students found" : "Aucun étudiant trouvé"}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === "en"
              ? "Try adjusting your search criteria or add a new student."
              : "Essayez d'ajuster vos critères de recherche ou ajoutez un nouvel étudiant."}
          </p>
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg mx-auto"
          >
            <UserPlus size={16} />
            {language === "en" ? "Add First Student" : "Ajouter le Premier Étudiant"}
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {language === "en"
                ? `Showing ${startIndex + 1}-${Math.min(startIndex + studentsPerPage, filteredStudents.length)} of ${filteredStudents.length} students`
                : `Affichage ${startIndex + 1}-${Math.min(startIndex + studentsPerPage, filteredStudents.length)} sur ${filteredStudents.length} étudiants`}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                {language === "en" ? "Previous" : "Précédent"}
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentPage === page ? "bg-green-600 text-white" : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {language === "en" ? "Next" : "Suivant"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && <StudentDetailsModal studentId={showDetailsModal} />}
    </div>
  )
}
