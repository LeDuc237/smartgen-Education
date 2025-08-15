"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  ArrowLeft,
  Save,
  User,
  GraduationCap,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Hash,
  Calendar,
} from "lucide-react"
import { getAllTeachers, createStudentWithRelationsAndPayments, getAllStudents } from "../../../lib/api"
import type { Teacher } from "../../../lib/types"

interface AddStudentProps {
  language: string
}

export default function AddStudent({ language }: AddStudentProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("")
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const [generatedId, setGeneratedId] = useState("")

  // Form data
  const [formData, setFormData] = useState({
    full_name: "",
    guardian_name: "",
    guardian_phone: "",
    user: "",
    class: "",
    quarter: "",
    days_per_week: 1,
    categories: "anglo" as "franco" | "anglo" | "bilingue",
  })

  // Payment data for each selected teacher
  const [paymentData, setPaymentData] = useState<
    Record<
      string,
      {
        amount: number
        payment_date: string
        next_payment_due: string
      }
    >
  >({})

  const generateStudentId = async (category: "franco" | "anglo" | "bilingue") => {
    try {
      // Get all existing students to determine the next number
      const existingStudents = await getAllStudents()

      const prefixes = {
        anglo: "ST00A",
        franco: "ST00F",
        bilingue: "ST00B",
      }

      // Filter students by category and extract numbers
      const categoryStudents = existingStudents.filter(
        (student) => student.identifier && student.identifier.startsWith(prefixes[category]),
      )

      // Extract numbers and find the highest one
      const existingNumbers = categoryStudents
        .map((student) => {
          const match = student.identifier?.match(/(\d+)$/)
          return match ? Number.parseInt(match[1]) : 0
        })
        .filter((num) => !isNaN(num) && num > 0)

      // Get the next number (highest + 1, or 1 if no existing students)
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1

      return `${prefixes[category]}${nextNumber}`
    } catch (error) {
      console.error("Error generating student ID:", error)
      // Fallback to timestamp-based ID if API fails
      const timestamp = Date.now().toString().slice(-3)
      const prefixes = {
        anglo: "ST00A",
        franco: "ST00F",
        bilingue: "ST00B",
      }
      return `${prefixes[category]}${timestamp}`
    }
  }

  useEffect(() => {
    if (formData.categories) {
      generateStudentId(formData.categories).then((newId) => {
        setGeneratedId(newId)
        setFormData((prev) => ({
          ...prev,
          user: newId,
        }))
      })
    }
  }, [formData.categories])

  // Load teachers on component mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true)
        const teachersData = await getAllTeachers()
        console.log("Loaded teachers:", teachersData) // Debug logging

        const approvedTeachers = teachersData.filter((teacher) => {
          // Check multiple possible approval fields
          const isApproved =
            teacher.is_approved === true ||
            teacher.is_approved === "true" ||
            teacher.status === "approved" ||
            teacher.status === "active" ||
            // If no approval status is explicitly set, include the teacher
            (teacher.is_approved === undefined && teacher.status === undefined) ||
            (teacher.is_approved === null && teacher.status === null)

          console.log(
            `Teacher ${teacher.full_name}: is_approved=${teacher.is_approved}, status=${teacher.status}, included=${isApproved}`,
          )
          return isApproved
        })

        console.log("Approved teachers:", approvedTeachers) // Debug logging
        setTeachers(approvedTeachers)

        if (approvedTeachers.length === 0) {
          console.warn("No approved teachers found. All teachers:", teachersData)
          toast.error(
            language === "en"
              ? "No approved teachers available. Please contact admin."
              : "Aucun enseignant approuvé disponible. Veuillez contacter l'administrateur.",
          )
        }
      } catch (error) {
        console.error("Error loading teachers:", error)
        toast.error(language === "en" ? "Failed to load teachers" : "Échec du chargement des enseignants")
      } finally {
        setLoadingTeachers(false)
      }
    }

    loadTeachers()
  }, [language])

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.subjects?.some((subject) => subject.toLowerCase().includes(teacherSearchTerm.toLowerCase())) ||
      teacher.town?.toLowerCase().includes(teacherSearchTerm.toLowerCase()),
  )

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "days_per_week" ? Number.parseInt(value) : value,
    }))
  }

  // Handle teacher selection
  const handleTeacherSelect = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      // Remove teacher
      setSelectedTeachers((prev) => prev.filter((id) => id !== teacherId))
      setPaymentData((prev) => {
        const newData = { ...prev }
        delete newData[teacherId]
        return newData
      })
    } else {
      // Add teacher
      setSelectedTeachers((prev) => [...prev, teacherId])
      const today = new Date()
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      setPaymentData((prev) => ({
        ...prev,
        [teacherId]: {
          amount: 0,
          payment_date: today.toISOString().split("T")[0],
          next_payment_due: nextMonth.toISOString().split("T")[0],
        },
      }))
    }
    setTeacherSearchTerm("")
    setShowTeacherDropdown(false)
  }

  const handlePaymentChange = (teacherId: string, field: string, value: string | number) => {
    setPaymentData((prev) => {
      const updatedData = {
        ...prev,
        [teacherId]: {
          ...prev[teacherId],
          [field]: value,
        },
      }

      // Auto-calculate next payment due when payment date changes (1 month interval)
      if (field === "payment_date" && typeof value === "string") {
        const paymentDate = new Date(value)
        const nextPaymentDate = new Date(paymentDate)
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

        updatedData[teacherId].next_payment_due = nextPaymentDate.toISOString().split("T")[0]
      }

      return updatedData
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.full_name.trim()) {
      toast.error(language === "en" ? "Student name is required" : "Le nom de l'étudiant est requis")
      return
    }

    if (!formData.guardian_name.trim()) {
      toast.error(language === "en" ? "Guardian name is required" : "Le nom du tuteur est requis")
      return
    }

    if (!formData.guardian_phone.trim()) {
      toast.error(language === "en" ? "Guardian phone is required" : "Le téléphone du tuteur est requis")
      return
    }

    if (!formData.categories) {
      toast.error(language === "en" ? "Student category is required" : "La catégorie de l'étudiant est requise")
      return
    }

    if (selectedTeachers.length === 0) {
      toast.error(
        language === "en" ? "Please select at least one teacher" : "Veuillez sélectionner au moins un enseignant",
      )
      return
    }

    // Validate payment data
    for (const teacherId of selectedTeachers) {
      const payment = paymentData[teacherId]
      if (!payment || payment.amount <= 0) {
        const teacher = teachers.find((t) => t.id === teacherId)
        toast.error(
          language === "en"
            ? `Please enter payment amount for ${teacher?.full_name}`
            : `Veuillez saisir le montant du paiement pour ${teacher?.full_name}`,
        )
        return
      }
    }

    try {
      setIsLoading(true)

      const studentData = {
        full_name: formData.full_name,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        class: formData.class,
        quarter: formData.quarter,
        days_per_week: formData.days_per_week,
        categories: formData.categories,
        identifier: generatedId,
        user: generatedId, // Username is the generated ID
      }

      console.log("Creating student with data:", studentData)

      await createStudentWithRelationsAndPayments(studentData, selectedTeachers, paymentData)

      toast.success(language === "en" ? "Student created successfully!" : "Étudiant créé avec succès!")

      // Navigate back to student management
      navigate("/admin-dashboard")
    } catch (error: any) {
      console.error("Error creating student:", error)
      toast.error(
        error.message || (language === "en" ? "Failed to create student" : "Échec de la création de l'étudiant"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate("/admin-dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            {language === "en" ? "Back" : "Retour"}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {language === "en" ? "Add New Student" : "Ajouter un Nouvel Étudiant"}
              </h1>
              <p className="text-gray-600">
                {language === "en" ? "Create a new student profile" : "Créer un nouveau profil d'étudiant"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {generatedId && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {language === "en" ? "Generated Student ID" : "ID Étudiant Généré"}
              </h3>
              <p className="text-2xl font-bold text-blue-600">{generatedId}</p>
              <p className="text-sm text-gray-600">
                {language === "en"
                  ? "This ID will be used as both identifier and username"
                  : "Cet ID sera utilisé comme identifiant et nom d'utilisateur"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            {language === "en" ? "Student Information" : "Informations de l'Étudiant"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Full Name" : "Nom Complet"} *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={language === "en" ? "Enter student's full name" : "Saisir le nom complet de l'étudiant"}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Student Category" : "Catégorie de l'Étudiant"} *
              </label>
              <select
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="anglo">{language === "en" ? "Anglophone" : "Anglophone"}</option>
                <option value="franco">{language === "en" ? "Francophone" : "Francophone"}</option>
                <option value="bilingue">{language === "en" ? "Bilingual" : "Bilingue"}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {language === "en"
                  ? "This determines the student ID format (ST00A for Anglo, ST00F for Franco, ST00B for Bilingual)"
                  : "Ceci détermine le format de l'ID étudiant (ST00A pour Anglo, ST00F pour Franco, ST00B pour Bilingue)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Username (Student ID)" : "Nom d'utilisateur (ID Étudiant)"} *
              </label>
              <input
                type="text"
                name="user"
                value={formData.user}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder={language === "en" ? "Auto-generated from category" : "Généré automatiquement"}
                readOnly
              />
              <p className="text-xs text-blue-600 mt-1">
                {language === "en"
                  ? "Automatically generated based on student category"
                  : "Généré automatiquement selon la catégorie de l'étudiant"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Class" : "Classe"}
              </label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={language === "en" ? "Enter class (e.g., Form 1, CM2)" : "Saisir la classe (ex: 6ème, CM2)"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Days per Week" : "Jours par Semaine"}
              </label>
              <select
                name="days_per_week"
                value={formData.days_per_week}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {day} {language === "en" ? (day === 1 ? "day" : "days") : day === 1 ? "jour" : "jours"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            {language === "en" ? "Guardian Information" : "Informations du Tuteur"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Guardian Name" : "Nom du Tuteur"} *
              </label>
              <input
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={language === "en" ? "Enter guardian's name" : "Saisir le nom du tuteur"}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Guardian Phone" : "Téléphone du Tuteur"} *
              </label>
              <input
                type="tel"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={language === "en" ? "Enter phone number" : "Saisir le numéro de téléphone"}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "en" ? "Quarter/Location" : "Quartier/Localisation"}
              </label>
              <input
                type="text"
                name="quarter"
                value={formData.quarter}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={language === "en" ? "Enter quarter or location" : "Saisir le quartier ou la localisation"}
              />
            </div>
          </div>
        </div>

        {/* Teacher Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            {language === "en" ? "Select Teachers" : "Sélectionner les Enseignants"}
            {!loadingTeachers && (
              <span className="text-sm font-normal text-gray-500">
                ({teachers.length} {language === "en" ? "available" : "disponibles"})
              </span>
            )}
          </h2>

          {loadingTeachers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">
                {language === "en" ? "Loading teachers..." : "Chargement des enseignants..."}
              </span>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {language === "en" ? "No Teachers Available" : "Aucun Enseignant Disponible"}
              </h3>
              <p className="text-yellow-700">
                {language === "en"
                  ? "No approved teachers found. Please contact the administrator to add teachers first."
                  : "Aucun enseignant approuvé trouvé. Veuillez contacter l'administrateur pour ajouter des enseignants d'abord."}
              </p>
            </div>
          ) : (
            <>
              {/* Teacher Search and Dropdown */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={teacherSearchTerm}
                    onChange={(e) => {
                      setTeacherSearchTerm(e.target.value)
                      setShowTeacherDropdown(true)
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={
                      language === "en"
                        ? "Search teachers by name, subject, or location..."
                        : "Rechercher par nom, matière ou localisation..."
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showTeacherDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Dropdown */}
                {showTeacherDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          onClick={() => handleTeacherSelect(teacher.id)}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            selectedTeachers.includes(teacher.id) ? "bg-green-50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{teacher.full_name}</span>
                                {selectedTeachers.includes(teacher.id) && <Check className="w-4 h-4 text-green-500" />}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects} •{" "}
                                {teacher.town}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {language === "en" ? "No teachers found" : "Aucun enseignant trouvé"}
                      </div>
                    )}

                    {/* Show all teachers button */}
                    {teacherSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherSearchTerm("")
                          setShowTeacherDropdown(true)
                        }}
                        className="w-full p-3 text-center text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                      >
                        {language === "en" ? "Show all teachers" : "Afficher tous les enseignants"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Teachers */}
              {selectedTeachers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {language === "en" ? "Selected Teachers" : "Enseignants Sélectionnés"} ({selectedTeachers.length})
                  </h3>

                  {selectedTeachers.map((teacherId) => {
                    const teacher = teachers.find((t) => t.id === teacherId)
                    if (!teacher) return null

                    return (
                      <div key={teacherId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {teacher.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{teacher.full_name}</h4>
                              <p className="text-sm text-gray-600">
                                {Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTeacherSelect(teacherId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === "en" ? "Payment Amount (XAF)" : "Montant du Paiement (XAF)"} *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={paymentData[teacherId]?.amount || ""}
                              onChange={(e) =>
                                handlePaymentChange(teacherId, "amount", Number.parseInt(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="0"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <Calendar size={14} />
                              {language === "en" ? "Payment Date" : "Date de Paiement"}
                            </label>
                            <input
                              type="date"
                              value={paymentData[teacherId]?.payment_date || ""}
                              onChange={(e) => handlePaymentChange(teacherId, "payment_date", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <Calendar size={14} />
                              {language === "en" ? "Next Payment Due" : "Prochain Paiement Dû"}
                            </label>
                            <input
                              type="date"
                              value={paymentData[teacherId]?.next_payment_due || ""}
                              onChange={(e) => handlePaymentChange(teacherId, "next_payment_due", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-blue-50"
                              readOnly
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              {language === "en"
                                ? "Auto-calculated (1 month from payment date)"
                                : "Calculé automatiquement (1 mois après la date de paiement)"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* No teachers selected message */}
              {selectedTeachers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {language === "en" ? "No teachers selected yet" : "Aucun enseignant sélectionné pour le moment"}
                  </p>
                  <p className="text-sm mt-2">
                    {language === "en"
                      ? "Search and select teachers from the dropdown above"
                      : "Recherchez et sélectionnez des enseignants dans la liste déroulante ci-dessus"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {language === "en" ? "Cancel" : "Annuler"}
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedTeachers.length === 0 || teachers.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {language === "en" ? "Creating..." : "Création..."}
              </>
            ) : (
              <>
                <Save size={16} />
                {language === "en" ? "Create Student" : "Créer l'Étudiant"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
