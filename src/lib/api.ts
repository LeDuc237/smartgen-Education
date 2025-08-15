import { supabase } from "./supabase"
import type {
  Teacher,
  Student,
  Comment,
  Notice,
  CompanyInfo,
  Payment,
  StudentWithPayments,
  Admin,
  StudentTeacherRelation,
} from "./types"
import { hash } from "bcryptjs"

// ───────────── STUDENT QUERIES ───────────── //

export async function getStudents() {
  const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Student[]
}

// New function to get all students (alias for consistency)
export async function getAllStudents() {
  return await getStudents()
}

// New function to get student by ID
export async function getStudentById(studentId: string) {
  const { data, error } = await supabase.from("students").select("*").eq("id", studentId).single()

  if (error) throw error
  return data as Student
}

// New function to update student
export async function updateStudent(studentId: string, updateData: Partial<Student>) {
  const { data, error } = await supabase.from("students").update(updateData).eq("id", studentId).select().single()

  if (error) throw error
  return data as Student
}

// Add this new function to get admins
export async function getAdmins() {
  const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Admin[]
}

export async function deleteStudent(studentId: string) {
  const { error } = await supabase.from("students").delete().eq("id", studentId)

  if (error) throw error
}

interface StudentPayload {
  full_name: string
  guardian_name: string
  guardian_phone: string
  user: string
  class: string
  quarter: string
  days_per_week: number
}

export async function createStudentWithRelationsAndPayments(
  studentData: StudentPayload,
  teacherIds: string[],
  paymentData: Record<
    string,
    {
      amount: number
      payment_date: string
      next_payment_due: string
    }
  >,
) {
  // Step 1: Insert student
  const { data: student, error: studentError } = await supabase.from("students").insert(studentData).select().single()

  if (studentError) throw new Error(`Student creation failed: ${studentError.message}`)

  const studentId = student.id

  // Step 2: Insert student-teacher relationships
  const relationsData = teacherIds.map((teacher_id) => ({
    student_id: studentId,
    teacher_id,
  }))

  const { error: relationsError } = await supabase.from("student_teacher_relations").insert(relationsData)

  if (relationsError) {
    await supabase.from("students").delete().eq("id", studentId)
    throw new Error(`Student-teacher relation creation failed: ${relationsError.message}`)
  }

  // Step 3: Insert payments
  const paymentsData = teacherIds.map((teacher_id) => {
    const payment = paymentData[teacher_id]
    return {
      student_id: studentId,
      teacher_id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      next_payment_due: payment.next_payment_due,
    }
  })

  const { error: paymentsError } = await supabase.from("payments").insert(paymentsData)

  if (paymentsError) {
    await supabase.from("student_teacher_relations").delete().eq("student_id", studentId)
    await supabase.from("students").delete().eq("id", studentId)
    throw new Error(`Payment insertion failed: ${paymentsError.message}`)
  }

  return student
}

interface StudentUpdatePayload {
  full_name: string
  guardian_name: string
  guardian_phone: string
  class: string
  quarter: string
  days_per_week: number
}

interface PaymentUpdate {
  amount: number
  payment_date: string
  next_payment_due: string
}

export async function updateStudentWithRelationsAndPayments(
  studentId: string,
  formData: StudentUpdatePayload,
  teacherIds: string[],
  paymentData: Record<string, PaymentUpdate>,
) {
  const { error } = await supabase.rpc("update_student_data", {
    student_id: studentId,
    student_data: formData,
    teacher_ids: teacherIds,
    payment_data: paymentData,
  })

  if (error) throw new Error(`Update failed: ${error.message}`)
}

// ───────────── TEACHER QUERIES ───────────── //

export async function getAllTeachers() {
  const { data, error } = await supabase.from("teachers").select("*")
  if (error) throw error
  return data
}

export async function deleteTeacher(teacherId: string) {
  const { error } = await supabase.from("teachers").delete().eq("id", teacherId)

  if (error) throw error
}

export async function approveTeacher(teacherId: string) {
  const { error } = await supabase.from("teachers").update({ is_approved: true }).eq("id", teacherId)

  if (error) throw error
}

export async function rejectTeacher(teacherId: string) {
  const { error } = await supabase.from("teachers").update({ is_approved: false }).eq("id", teacherId)

  if (error) throw error
}

export async function getTeachers(searchQuery?: string) {
  let query = supabase
    .from("teachers")
    .select("*")
    .order("success_rate", { ascending: false })
    .order("created_at", { ascending: true })

  if (searchQuery) {
    query = query.or(`
      full_name.ilike.%${searchQuery}%,
      subjects.cs.{${searchQuery}},
      current_work.ilike.%${searchQuery}%
    `)
  }

  const { data, error } = await query
  if (error) throw error

  return data as (Teacher & {
    comments: (Comment & { students: { full_name: string } })[]
  })[]
}

export async function getTeacherById(id: string) {
  const { data, error } = await supabase
    .from("teachers")
    .select(`
      *,
      comments!comments_teacher_id_fkey (
        *,
        students!comments_student_id_fkey (
          full_name
        )
      )
    `)
    .eq("id", id)
    .eq("is_approved", true)
    .single()

  if (error) throw error

  return data as Teacher & {
    comments: (Comment & { students: { full_name: string } })[]
  }
}

export async function getTeacher(filter: { is_approved?: boolean } = {}) {
  let query = supabase.from("teachers").select("*").order("success_rate", { ascending: false })

  if (filter.is_approved !== undefined) {
    query = query.eq("is_approved", filter.is_approved)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Teacher[]
}

export async function getTeacherByUser(id: string) {
  const { data, error } = await supabase.from("teachers").select("*").eq("id", id).single()

  if (error) throw error
  return data as Teacher
}

interface TeacherData {
  full_name: string
  user: string
  email: string
  contact: string
  highest_diploma: string
  town: string
  gender: "male" | "female"
  category: "anglo" | "franco"
  years_experience: string
  subjects: string[]
  location: string[]
  available_days: string[]
  password: string
  profile_image_url: string
}

export async function createTeacher(teacherData: TeacherData, language: "en" | "fr" = "en") {
  try {
    const requiredFields = [
      "full_name",
      "user",
      "email",
      "contact",
      "town",
      "gender",
      "category",
      "password",
      "subjects",
      "location",
      "available_days",
    ]

    const missingFields = requiredFields.filter((field) => !teacherData[field as keyof TeacherData])
    if (missingFields.length > 0) {
      const errorMessage =
        language === "en"
          ? `Missing required fields: ${missingFields.join(", ")}`
          : `Champs obligatoires manquants : ${missingFields.join(", ")}`
      throw new Error(errorMessage)
    }

    const { data: existingUser, error: userError } = await supabase
      .from("teachers")
      .select("user")
      .eq("user", teacherData.user)
      .single()

    if (!userError || existingUser) {
      throw new Error(
        language === "en"
          ? "Username already used. Please choose another."
          : "Nom d'utilisateur déjà utilisé. Veuillez en choisir un autre.",
      )
    }

    const { data, error } = await supabase
      .from("teachers")
      .insert([
        {
          ...teacherData,
          profile_image_url: teacherData.profile_image_url || null,
          subjects: teacherData.subjects,
          location: teacherData.location,
          available_days: teacherData.available_days,
        },
      ])
      .select()

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          language === "en"
            ? "Username already used. Please choose another."
            : "Nom d'utilisateur déjà utilisé. Veuillez en choisir un autre.",
        )
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Teacher creation error:", error)

    if (error instanceof Error) {
      const message = error.message
      if (message.includes("already used")) {
        throw error
      }
      throw new Error(
        language === "en"
          ? "Error creating teacher profile. Please try again."
          : "Erreur lors de la création du profil. Veuillez réessayer.",
      )
    }

    throw new Error(language === "en" ? "Unknown error occurred" : "Une erreur inconnue est survenue")
  }
}

export async function createTeachers(formData: {
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
  years_experience: number
  profile_image_url: string
  about_me: string
  current_work: string
  available_days: string[]
  is_approved: boolean
  success_rate: number
}) {
  try {
    const requiredFields = [
      "full_name",
      "user",
      "email",
      "contact",
      "town",
      "gender",
      "category",
      "password",
      "subjects",
      "location",
      "available_days",
    ]

    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
    }

    const { data, error } = await supabase
      .from("teachers")
      .insert([
        {
          ...formData,
          profile_image_url: formData.profile_image_url || null,
          subjects: formData.subjects,
          location: formData.location,
          available_days: formData.available_days,
        },
      ])
      .select()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("Teacher creation error:", error)
    throw new Error(error.message || "Unknown error occurred")
  }
}

export async function updateTeacherProfiles(id: string, formData: FormData): Promise<Teacher> {
  try {
    const imageFile = formData.get("image") as File | null
    const updates = JSON.parse(formData.get("data") as string) as Partial<Teacher>

    if (updates.password) {
      if (updates.password.length < 4) {
        throw new Error("Password must be at least 4 characters")
      }
      updates.password = await hash(updates.password, 10)
    }

    if (imageFile) {
      const uploadFormData = new FormData()
      uploadFormData.append("profilePhoto", imageFile)

      const uploadRes = await fetch("https://image-server-p9hg.onrender.com/uploads", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadRes.ok) throw new Error("Image upload failed")

      const { fileName } = await uploadRes.json()
      updates.profile_image_url = `https://res.cloudinary.com/dfrznvwmu/image/upload/user-profiles/${fileName}`

      const { data: currentTeacher } = await supabase.from("teachers").select("profile_image_url").eq("id", id).single()

      if (currentTeacher?.profile_image_url) {
        const publicId = currentTeacher.profile_image_url.split("/").pop()?.split(".")[0]
        if (publicId) {
          await fetch("https://image-server-p9hg.onrender.com/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId }),
          })
        }
      }
    }

    const { data, error } = await supabase.from("teachers").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Update failed:", error)
    throw new Error(error instanceof Error ? error.message : "Profile update failed")
  }
}

export async function updateTeacherProfile(
  id: string,
  formData: {
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
    years_experience: number
    highest_diploma: string
    category: string
    gender: string
    is_approved: boolean
    success_rate: number
    profile_image_url: string
    previousPhotoId?: string
  },
) {
  try {
    const updates: Partial<Teacher> = {
      full_name: formData.full_name?.trim() || "",
      about_me: formData.about_me?.trim() || "",
      contact: formData.contact?.trim() || "",
      town: formData.town?.trim() || "",
      current_work: formData.current_work?.trim() || "",
      subjects: (formData.subjects || []).filter((s) => s?.trim()),
      available_days: (formData.available_days || []).filter((d) => d?.trim()),
      location: (formData.location || []).filter((l) => l?.trim()),
      user: formData.user?.trim() || "",
      email: formData.email?.trim() || "",
      years_experience: formData.years_experience,
      highest_diploma: formData.highest_diploma?.trim() || "",
      category: formData.category,
      gender: formData.gender,
      is_approved: formData.is_approved,
      success_rate: formData.success_rate,
      profile_image_url: formData.profile_image_url || "",
    }

    if (formData.password) {
      if (formData.password.length < 4) throw new Error("Password too short")
      updates.password = await hash(formData.password, 10)
    }

    const { data, error } = await supabase.from("teachers").update(updates).eq("id", id).select().single()

    if (error) throw error

    if (
      formData.previousPhotoId &&
      formData.previousPhotoId !== formData.profile_image_url &&
      formData.previousPhotoId.startsWith("http")
    ) {
      const publicId = formData.previousPhotoId.split("/").pop()?.split(".")[0] || ""

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`

      const deletionData = new FormData()
      deletionData.append("public_id", publicId)
      deletionData.append("api_key", process.env.CLOUDINARY_KEY!)
      deletionData.append("api_secret", process.env.CLOUDINARY_SECRET!)
      deletionData.append("timestamp", Date.now().toString())

      await fetch(cloudinaryUrl, {
        method: "POST",
        body: deletionData,
      })
    }

    return data
  } catch (error) {
    console.error("Update failed:", error)
    throw new Error(error instanceof Error ? error.message : "Update failed")
  }
}

export async function getTeacherProfile(userId: string) {
  const { data, error } = await supabase.from("teachers").select("*").eq("user", userId).single()

  if (error) throw error
  return data as Teacher
}

export async function getTeacherStudentsWithPayments(teacherId: string): Promise<StudentWithPayments[]> {
  try {
    const { data: relations, error: relationsError } = await supabase
      .from("student_teacher_relations")
      .select(`
        students (
          id,
          full_name,
          guardian_name,
          guardian_phone,
          class,
          quarter,
          created_at
        )
      `)
      .eq("teacher_id", teacherId)

    if (relationsError) throw relationsError
    if (!relations || relations.length === 0) return []

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", relations.map((r) => r.students?.id).filter(Boolean) as string[])

    if (paymentsError) throw paymentsError

    return relations
      .map((relation) => ({
        ...relation.students,
        payments: payments?.filter((p) => p.student_id === relation.students?.id) || [],
      }))
      .filter((student) => student.id)
  } catch (error) {
    console.error("Error in getTeacherStudentsWithPayments:", error)
    throw new Error("Failed to fetch students with payments")
  }
}

export async function getTeacherPayments(teacherId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("payment_date", { ascending: false })

  if (error) throw error
  return data as Payment[]
}

export async function getTeacherd(id: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      comments!comments_teacher_id_fkey (
        *,
        students!comments_student_id_fkey (
          full_name
        )
      )
    `)
    .eq('id', id)
    .eq('is_approved', true)  // Only get approved teachers
    .single();

  if (error) throw error;

  return data as Teacher & {
    comments: (Comment & { students: { full_name: string } })[];
  };
} 

  export async function getTeacherA(id: string) {
  // Fetch data from the 'teachers' table where the teacher's 'id' matches the provided 'id'
  const { data, error } = await supabase
    .from('teachers')
    .select('*')  // Select all columns
    .eq('id', id) // Filter by 'id'
    .single();    // Ensure only one record is returned

  // If there's an error, throw it
  if (error) throw error;

  // Return the data as a 'Teacher' type
  return data as Teacher;
} 
// ───────────── STUDENT PROFILE QUERIES ───────────── //

export async function getStudentProfile(userId: string) {
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      student_teacher_relations (
        teachers (
          id,
          full_name,
          email,
          available_days,
          current_work,
          success_rate,
          subjects,
          contact,
          highest_diploma,
          years_experience,
          about_me,
          profile_image_url,
          location,
          payments (
            amount,
            payment_date,
            next_payment_due
          )
        )
      )
    `)
    .eq("user", userId)
    .single()

  if (error) throw new Error(`Failed to fetch student: ${error.message}`)

  return {
    ...data,
    teachers: data.student_teacher_relations.map((rel) => ({
      ...rel.teachers,
      payments: rel.teachers.payments,
    })),
  }
}

export async function getStudentPayments(studentId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      teachers (
        full_name
      )
    `)
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false })

  if (error) throw error
  return data as (Payment & { teachers: { full_name: string } })[]
}

// ───────────── STUDENT-TEACHER RELATIONS ───────────── //

export async function getStudentTeachers(): Promise<StudentTeacherRelation[]> {
  const { data, error } = await supabase.from("student_teacher_relations").select("*")

  if (error) {
    console.error("Error fetching student_teacher data:", error)
    throw new Error("Failed to fetch student-teacher relationships")
  }

  return data || []
}

// New function to get all student-teacher relations (alias for consistency)
export async function getAllStudentTeacherRelations() {
  return await getStudentTeachers()
}


export async function createStudentTeacherRelation(relationData: {
  student_id: string
  teacher_id: string
  days_per_week?: number
}): Promise<StudentTeacherRelation> {
  const { data, error } = await supabase.from("student_teacher_relations").insert([relationData]).select().single()

  if (error) {
    console.error("Error creating student-teacher relation:", error)
    throw new Error("Failed to create student-teacher relation")
  }

  return data
}

export async function deleteStudentTeacherRelation(relationId: string): Promise<void> {
  const { error } = await supabase.from("student_teacher_relations").delete().eq("id", relationId)

  if (error) {
    console.error("Error deleting student-teacher relation:", error)
    throw new Error("Failed to delete student-teacher relation")
  }
}

// ───────────── PAYMENT QUERIES ───────────── //

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from("payments").select("*").order("payment_date", { ascending: false })

  if (error) {
    console.error("Error fetching payment data:", error)
    throw new Error("Failed to fetch payments")
  }

  return data || []
}

// Add this to your payment queries section
export async function createStudentPayment(paymentData: {
  student_id: string
  teacher_id: string
  amount: number
  payment_date: string
  next_payment_due: string
}): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert([paymentData])
    .select()
    .single()

  if (error) throw error
  return data
}
// New function to get all payments (alias for consistency)
export async function getAllPayments() {
  return await getPayments()
}

export async function getPaymentsWithDetails() {
  const { data, error } = await supabase.from("payments").select(`
      id,
      amount,
      payment_date,
      due_date,
      student:student_id (
        id,
        full_name,
        class,
        guardian_name
      ),
      teacher:teacher_id (
        id,
        full_name,
        subjects
      )
    `)

  if (error) {
    console.error("Error fetching detailed payments:", error)
    throw new Error("Failed to fetch detailed payment data")
  }

  return data
}

export async function deleteStudentPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId);

  if (error) throw error;
}


export async function updateStudentPayment(
  paymentId: string,
  updateData: {
    amount?: number
    payment_date?: string
    next_payment_due?: string
    status?: string
  }
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
// ───────────── NOTICE QUERIES ───────────── //

export async function getNotices() {
  const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Notice[]
}

export async function createNotice(noticeData: {
  title: string
  content: string
  type: "text" | "image" | "video" | "link"
  image_url?: string
}) {
  const { data, error } = await supabase.from("notices").insert([noticeData]).select().single()

  if (error) throw error
  return data as Notice
}

export async function updateNotice(noticeId: string, updateData: Partial<Notice>) {
  const { data, error } = await supabase.from("notices").update(updateData).eq("id", noticeId).select().single()

  if (error) throw error
  return data as Notice
}

export async function deleteNotice(noticeId: string) {
  const { error } = await supabase.from("notices").delete().eq("id", noticeId)

  if (error) throw error
}

// ───────────── COMPANY INFO ───────────── //

export async function getCompanyInfo() {
  const { data, error } = await supabase.from("company_info").select("*").single()

  if (error) throw error
  return data as CompanyInfo
}

export async function updateCompanyInfo(updateData: Partial<CompanyInfo>) {
  const { data, error } = await supabase
    .from("company_info")
    .update(updateData)
    .eq("id", updateData.id)
    .select()
    .single()

  if (error) throw error
  return data as CompanyInfo
}

// ───────────── AUTHENTICATION ───────────── //

export async function studentLogin(identifier: string, fullName: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user", identifier)
    .eq("full_name", fullName)
    .single()

  if (error) throw error
  return data as Student
}

export async function teacherLogin(identifier: string, password: string) {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("user", identifier)
    .eq("password", password)
    .single()

  if (error) throw error
  return data as Teacher
}

export async function adminLogin(email: string, password: string) {
  const { data, error } = await supabase.from("admins").select("*").eq("email", email).eq("password", password).single()

  if (error) throw error
  return data
}

// ───────────── VISIT TRACKING ───────────── //

export async function logVisit(visitorId: string, location: string) {
  const { error } = await supabase.from("visits").insert({ visitor_id: visitorId, location })

  if (error) throw error
}

// ───────────── TEACHER COMMENTS ───────────── //

export async function getTeacherComments(teacherId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      rating,
      created_at,
      student:students(full_name)
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as {
    id: string
    content: string
    rating: number
    created_at: string
    student: {
      full_name: string
    }
  }[]
}

export async function createTeacherComment(teacherId: string, studentId: string, content: string, rating: number) {
  const { error } = await supabase.from("comments").insert({
    teacher_id: teacherId,
    student_id: studentId,
    content,
    rating,
  })

  if (error) throw error
  return true
}

// ───────────── ADMIN MANAGEMENT ───────────── //

export async function createAdmin(adminData: {
  full_name: string
  role: "promoteur" | "chef coordonateur" | "coordonateur" | "IT supervisor"
  email: string
  about_me: string
  current_work: string
  profile_image_url: string
  user: string
  whatsapp_number: string
  password: string
}) {
  const { data, error } = await supabase.from("admins").insert([adminData]).select().single()

  if (error) throw error
  return data as Admin
}

export async function updateAdmin(adminId: string, updateData: Partial<Admin>) {
  const { data, error } = await supabase.from("admins").update(updateData).eq("id", adminId).select().single()

  if (error) throw error
  return data as Admin
}

export async function deleteAdmin(adminId: string) {
  const { error } = await supabase.from("admins").delete().eq("id", adminId)

  if (error) throw error
}

// ───────────── STATISTICS AND ANALYTICS ───────────── //

export async function getDashboardStats() {
  try {
    const [studentsData, teachersData, paymentsData, noticesData] = await Promise.all([
      supabase.from("students").select("id", { count: "exact" }),
      supabase.from("teachers").select("id, is_approved", { count: "exact" }),
      supabase.from("payments").select("amount"),
      supabase.from("notices").select("id", { count: "exact" }),
    ])

    const totalStudents = studentsData.count || 0
    const totalTeachers = teachersData.count || 0
    const approvedTeachers = teachersData.data?.filter((t) => t.is_approved).length || 0
    const pendingTeachers = totalTeachers - approvedTeachers
    const totalRevenue = paymentsData.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const totalNotices = noticesData.count || 0

    return {
      totalStudents,
      totalTeachers,
      approvedTeachers,
      pendingTeachers,
      totalRevenue,
      totalNotices,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw new Error("Failed to fetch dashboard statistics")
  }
}

export async function getRecentActivities() {
  try {
    const [recentStudents, recentPayments, recentTeachers] = await Promise.all([
      supabase.from("students").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(5),
      supabase
        .from("payments")
        .select("id, amount, payment_date, students(full_name), teachers(full_name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("teachers")
        .select("id, full_name, created_at, is_approved")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    return {
      recentStudents: recentStudents.data || [],
      recentPayments: recentPayments.data || [],
      recentTeachers: recentTeachers.data || [],
    }
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    throw new Error("Failed to fetch recent activities")
  }
}

// ───────────── BULK OPERATIONS ───────────── //

export async function bulkDeleteStudents(studentIds: string[]) {
  const { error } = await supabase.from("students").delete().in("id", studentIds)

  if (error) throw error
}

export async function bulkDeleteTeachers(teacherIds: string[]) {
  const { error } = await supabase.from("teachers").delete().in("id", teacherIds)

  if (error) throw error
}

export async function bulkApproveTeachers(teacherIds: string[]) {
  const { error } = await supabase.from("teachers").update({ is_approved: true }).in("id", teacherIds)

  if (error) throw error
}

export async function bulkRejectTeachers(teacherIds: string[]) {
  const { error } = await supabase.from("teachers").update({ is_approved: false }).in("id", teacherIds)

  if (error) throw error
}

// ───────────── SEARCH AND FILTERING ───────────── //

export async function searchStudents(query: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .or(`full_name.ilike.%${query}%, guardian_name.ilike.%${query}%, class.ilike.%${query}%, quarter.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Student[]
}

export async function searchTeachers(query: string) {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .or(`full_name.ilike.%${query}%, email.ilike.%${query}%, subjects.cs.{${query}}, town.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Teacher[]
}

// ───────────── EXPORT FUNCTIONS ───────────── //

export async function exportStudentsData() {
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      student_teacher_relations (
        teachers (
          full_name,
          subjects
        )
      ),
      payments (
        amount,
        payment_date,
        next_payment_due
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function exportTeachersData() {
  const { data, error } = await supabase
    .from("teachers")
    .select(`
      *,
      student_teacher_relations (
        students (
          full_name,
          class
        )
      ),
      payments (
        amount,
        payment_date
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function exportPaymentsData() {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        full_name,
        guardian_name,
        class
      ),
      teachers (
        full_name,
        subjects
      )
    `)
    .order("payment_date", { ascending: false })

  if (error) throw error
  return data
}
