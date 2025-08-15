"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useTranslation } from "../../../context/TranslationContext"
import {
  getAllTeachers,
  getStudentById,
  updateStudent,
  getAllStudentTeacherRelations,
  createStudentTeacherRelation,
  deleteStudentTeacherRelation,
  getStudentPayments,
  createStudentPayment,
  updateStudentPayment,
  deleteStudentPayment,
} from "../../../lib/api"
import {
  ArrowLeft,
  UserCheckIcon as UserEdit,
  Save,
  Loader,
  Users,
  Plus,
  X,
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react"
import type { Teacher, StudentTeacherRelation, Payment } from "../../../lib/types"

export default function EditStudent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [currentTeachers, setCurrentTeachers] = useState<StudentTeacherRelation[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_date: "",
    teacher_id: "",
    status: "pending" as "pending" | "completed" | "overdue",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    guardian_name: "",
    guardian_phone: "",
    class: "",
    quarter: "",
    user: "",
    identifier: "",
    categories: "anglo" as "franco" | "anglo" | "bilingue",
    days_per_week: 3,
    payment_date: "",
    next_payment_date: "",
  })

  const calculateNextPaymentDate = (currentDate: string): string => {
    if (!currentDate) return ""
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split("T")[0]
  }

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error(language === "en" ? "Student ID is required" : "ID de l'étudiant requis")
        navigate("/admin-dashboard")
        return
      }

      try {
        setIsLoading(true)
        const [allTeachers, studentData, studentTeacherRelations, studentPayments] = await Promise.all([
          getAllTeachers(),
          getStudentById(id),
          getAllStudentTeacherRelations(),
          getStudentPayments(id),
        ])

        setTeachers(
          allTeachers.filter(
            (teacher) =>
              teacher.status === "approved" ||
              teacher.status === "active" ||
              teacher.approved === true ||
              teacher.approved === "true",
          ),
        )
        setCurrentTeachers(studentTeacherRelations.filter((rel) => rel.student_id === id))
        setPayments(studentPayments || [])

        if (studentData) {
          setFormData({
            full_name: studentData.full_name || "",
            guardian_name: studentData.guardian_name || "",
            guardian_phone: studentData.guardian_phone || "",
            class: studentData.class || "",
            quarter: studentData.quarter || "",
            user: studentData.user || studentData.identifier || "",
            identifier: studentData.identifier || "",
            categories: studentData.categories || "anglo",
            days_per_week: studentData.days_per_week || 3,
            payment_date: studentData.payment_date || "",
            next_payment_date: studentData.next_payment_date || "",
          })
        } else {
          throw new Error("Student not found")
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error(language === "en" ? "Failed to load student data" : "Échec du chargement des données de l'étudiant")
        navigate("/admin-dashboard?tab=students")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, language, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) return

    if (!formData.full_name || !formData.guardian_name || !formData.guardian_phone || !formData.user) {
      toast.error(
        language === "en" ? "Please fill in all required fields" : "Veuillez remplir tous les champs obligatoires",
      )
      return
    }

    try {
      setIsSubmitting(true)

      const updatedFormData = {
        ...formData,
        next_payment_date: formData.payment_date
          ? calculateNextPaymentDate(formData.payment_date)
          : formData.next_payment_date,
      }

      await updateStudent(id, updatedFormData)

      toast.success(language === "en" ? "Student updated successfully" : "Étudiant mis à jour avec succès")

      navigate("/admin-dashboard?tab=students")
    } catch (error) {
      console.error("Error updating student:", error)
      toast.error(language === "en" ? "Failed to update student" : "Échec de la mise à jour de l'étudiant")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTeacher = async (teacherId: string) => {
    if (!id) return

    try {
      await createStudentTeacherRelation({
        student_id: id,
        teacher_id: teacherId,
        days_per_week: formData.days_per_week,
      })

      const updatedRelations = await getAllStudentTeacherRelations()
      setCurrentTeachers(updatedRelations.filter((rel) => rel.student_id === id))

      toast.success(language === "en" ? "Teacher added successfully" : "Enseignant ajouté avec succès")
      setSearchTerm("")
    } catch (error) {
      console.error("Error adding teacher:", error)
      toast.error(language === "en" ? "Failed to add teacher" : "Échec de l'ajout de l'enseignant")
    }
  }

  const handleRemoveTeacher = async (relationId: string) => {
    if (
      window.confirm(
        language === "en"
          ? "Are you sure you want to remove this teacher?"
          : "Êtes-vous sûr de vouloir retirer cet enseignant?",
      )
    ) {
      try {
        await deleteStudentTeacherRelation(relationId)

        const updatedRelations = await getAllStudentTeacherRelations()
        setCurrentTeachers(updatedRelations.filter((rel) => rel.student_id === id))

        toast.success(language === "en" ? "Teacher removed successfully" : "Enseignant retiré avec succès")
      } catch (error) {
        console.error("Error removing teacher:", error)
        toast.error(language === "en" ? "Failed to remove teacher" : "Échec du retrait de l'enseignant")
      }
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newPayment.amount || !newPayment.payment_date || !newPayment.teacher_id) {
      toast.error(language === "en" ? "Please fill all payment fields" : "Veuillez remplir tous les champs de paiement")
      return
    }

    try {
      setIsLoadingPayments(true)
      await createStudentPayment({
        student_id: id,
        teacher_id: newPayment.teacher_id,
        amount: Number.parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date,
        status: newPayment.status,
      })

      const updatedPayments = await getStudentPayments(id)
      setPayments(updatedPayments || [])
      setNewPayment({ amount: "", payment_date: "", teacher_id: "", status: "pending" })
      setShowAddPayment(false)
      toast.success(language === "en" ? "Payment added successfully" : "Paiement ajouté avec succès")
    } catch (error) {
      console.error("Error adding payment:", error)
      toast.error(language === "en" ? "Failed to add payment" : "Échec de l'ajout du paiement")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleUpdatePaymentStatus = async (paymentId: string, status: "pending" | "completed" | "overdue") => {
    try {
      setIsLoadingPayments(true)
      await updateStudentPayment(paymentId, { status })
      const updatedPayments = await getStudentPayments(id!)
      setPayments(updatedPayments || [])
      toast.success(language === "en" ? "Payment status updated" : "Statut du paiement mis à jour")
    } catch (error) {
      console.error("Error updating payment:", error)
      toast.error(language === "en" ? "Failed to update payment" : "Échec de la mise à jour du paiement")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm(language === "en" ? "Delete this payment?" : "Supprimer ce paiement?")) {
      try {
        setIsLoadingPayments(true)
        await deleteStudentPayment(paymentId)
        const updatedPayments = await getStudentPayments(id!)
        setPayments(updatedPayments || [])
        toast.success(language === "en" ? "Payment deleted" : "Paiement supprimé")
      } catch (error) {
        console.error("Error deleting payment:", error)
        toast.error(language === "en" ? "Failed to delete payment" : "Échec de la suppression du paiement")
      } finally {
        setIsLoadingPayments(false)
      }
    }
  }

  const assignedTeacherIds = currentTeachers.map((rel) => rel.teacher_id)
  const availableTeachers = teachers.filter(
    (teacher) =>
      !assignedTeacherIds.includes(teacher.id) && teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === "en" ? "Loading student data..." : "Chargement des données de l'étudiant..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/admin-dashboard?tab=students")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            {language === "en" ? "Back to Students" : "Retour aux Étudiants"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <UserEdit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {language === "en" ? "Edit Student" : "Modifier l'Étudiant"}
            </h1>
            <p className="text-gray-600">
              {language === "en"
                ? "Update student information and manage teacher assignments"
                : "Mettre à jour les informations de l'étudiant et gérer les assignations d'enseignants"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <UserEdit className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {language === "en" ? "Student Information" : "Informations de l'Étudiant"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Full Name" : "Nom complet"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Student ID" : "ID Étudiant"}
                </label>
                <input
                  type="text"
                  value={formData.identifier}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600"
                  placeholder={language === "en" ? "Auto-generated" : "Généré automatiquement"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Username" : "Nom d'utilisateur"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Category" : "Catégorie"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({ ...formData, categories: e.target.value as "franco" | "anglo" | "bilingue" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="anglo">{language === "en" ? "Anglophone" : "Anglophone"}</option>
                  <option value="franco">{language === "en" ? "Francophone" : "Francophone"}</option>
                  <option value="bilingue">{language === "en" ? "Bilingual" : "Bilingue"}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Guardian Name" : "Nom du tuteur"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Guardian Phone" : "Téléphone du tuteur"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Class" : "Classe"}
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Quarter" : "Quartier"}
                </label>
                <input
                  type="text"
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Payment Date" : "Date de paiement"}
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_date: e.target.value,
                      next_payment_date: calculateNextPaymentDate(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Next Payment Date" : "Prochaine date de paiement"}
                </label>
                <input
                  type="date"
                  value={formData.next_payment_date}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === "en" ? "Days per Week" : "Jours par semaine"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.days_per_week}
                  onChange={(e) => setFormData({ ...formData, days_per_week: Number.parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/admin-dashboard")}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                {language === "en" ? "Cancel" : "Annuler"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:from-green-700 hover:to-green-800"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {language === "en" ? "Saving..." : "Enregistrement..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {language === "en" ? "Save Changes" : "Enregistrer les modifications"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {language === "en" ? "Manage Teachers" : "Gérer les Enseignants"}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {language === "en" ? "Assigned Teachers" : "Enseignants assignés"} ({currentTeachers.length})
              </h3>
              {currentTeachers.length > 0 ? (
                <div className="space-y-2">
                  {currentTeachers.map((relation) => {
                    const teacher = teachers.find((t) => t.id === relation.teacher_id)
                    return (
                      <div key={relation.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium text-blue-800">{teacher?.full_name || "Unknown Teacher"}</span>
                          <p className="text-sm text-blue-600">{teacher?.subjects}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacher(relation.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                          title={language === "en" ? "Remove teacher" : "Retirer l'enseignant"}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  {language === "en" ? "No teachers assigned yet" : "Aucun enseignant assigné pour le moment"}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {language === "en" ? "Add Teacher" : "Ajouter un enseignant"}
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={language === "en" ? "Search teacher by name" : "Rechercher un enseignant"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />

                {searchTerm && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {availableTeachers.length > 0 ? (
                      availableTeachers.map((teacher) => (
                        <div key={teacher.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <button
                            type="button"
                            onClick={() => handleAddTeacher(teacher.id)}
                            className="w-full text-left flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-gray-800">{teacher.full_name}</span>
                              <p className="text-sm text-gray-500">{teacher.subjects}</p>
                            </div>
                            <Plus size={16} className="text-green-600" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {language === "en" ? "No available teachers found" : "Aucun enseignant disponible trouvé"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {language === "en" ? "Payment Information" : "Informations de Paiement"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {language === "en" ? "Total Paid" : "Total Payé"}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {payments
                  .filter((p) => p.status === "completed")
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                FCFA
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  {language === "en" ? "Pending" : "En Attente"}
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {payments
                  .filter((p) => p.status === "pending")
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                FCFA
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === "en" ? "Add Payment" : "Ajouter un Paiement"}
          </button>

          {showAddPayment && (
            <form onSubmit={handleAddPayment} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Amount (FCFA)" : "Montant (FCFA)"}
                  </label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "en" ? "Date" : "Date"}
                  </label>
                  <input
                    type="date"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "en" ? "Teacher" : "Enseignant"}
                </label>
                <select
                  value={newPayment.teacher_id}
                  onChange={(e) => setNewPayment({ ...newPayment, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">{language === "en" ? "Select Teacher" : "Sélectionner un Enseignant"}</option>
                  {currentTeachers.map((relation) => {
                    const teacher = teachers.find((t) => t.id === relation.teacher_id)
                    return (
                      <option key={relation.teacher_id} value={relation.teacher_id}>
                        {teacher?.full_name || "Unknown Teacher"}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoadingPayments}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoadingPayments ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : language === "en" ? (
                    "Add"
                  ) : (
                    "Ajouter"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  {language === "en" ? "Cancel" : "Annuler"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {language === "en" ? "Payment History" : "Historique des Paiements"} ({payments.length})
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {payments.map((payment) => {
                  const teacher = teachers.find((t) => t.id === payment.teacher_id)
                  const statusColors = {
                    completed: "bg-green-50 text-green-800 border-green-200",
                    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
                    overdue: "bg-red-50 text-red-800 border-red-200",
                  }
                  return (
                    <div key={payment.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{payment.payment_date}</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{payment.amount.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{teacher?.full_name || "Unknown Teacher"}</p>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full border ${statusColors[payment.status]}`}
                          >
                            {payment.status === "completed" && (language === "en" ? "Completed" : "Terminé")}
                            {payment.status === "pending" && (language === "en" ? "Pending" : "En Attente")}
                            {payment.status === "overdue" && (language === "en" ? "Overdue" : "En Retard")}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {payment.status !== "completed" && (
                            <button
                              onClick={() => handleUpdatePaymentStatus(payment.id, "completed")}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              title={language === "en" ? "Mark as completed" : "Marquer comme terminé"}
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            title={language === "en" ? "Delete payment" : "Supprimer le paiement"}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                {language === "en" ? "No payment history available" : "Aucun historique de paiement disponible"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
