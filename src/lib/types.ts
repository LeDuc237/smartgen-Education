export interface Teacher {
  id: string
  full_name: string
  email: string
  about_me: string
  years_experience: number
  highest_diploma: string
  contact: string
  town: string
  current_work: string
  subjects: string[]
  number_reviews: number
  success_rate: number
  available_days: string[]
  gender: "male" | "female"
  category: "anglo" | "franco" | "bilingue"
  profile_image_url: string
  password: string
  user: string
  is_approved: boolean
  last_login?: string
  created_at: string
  updated_at: string
  location: string[]
}

export interface Student {
  id: string
  identifier: string
  full_name: string
  guardian_name: string
  guardian_phone: string
  class: string
  quarter: string
  days_per_week: number
  user: string
  last_login?: string
  created_at: string
  updated_at: string
  categories: "franco" | "anglo" | "bilingue"
}

export interface Admin {
  id: string
  full_name: string
  role: "promoteur" | "chef coordonateur" | "coordonateur" | "IT supervisor"
  email: string
  about_me: string
  current_work: string
  profile_image_url: string
  user: string
  last_login?: string
  whatsapp_number: string
  password: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  teacher_id: string
  student_id: string
  content: string
  rating: number
  created_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  type: "text" | "image" | "video" | "link"
  image_url?: string
  created_at: string
  updated_at: string
}

export interface CompanyInfo {
  id: string
  Name: string
  about_us_en: string
  about_us_fr: string
  about_image1_url: string
  about_image2_url: string
  logo: string
  contact: string
  address: string
  email: string
  location: string
  whatsapp_number: string
  payment_info: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  teacher_id: string | null | undefined
  student_id: string | null | undefined
  amount: number
  payment_date: string
  next_payment_due: string
  status?: "pending" | "completed" | "failed"
  created_at: string
}

export interface Visit {
  id: string
  visitor_id: string
  location: string
  created_at: string
}

export interface StudentTeacherRelation {
  student_id: string
  teacher_id: string
  created_at: string
}

export interface StudentWithPayments {
  id: string
  identifier: string
  full_name: string
  guardian_name: string
  guardian_phone: string
  class: string
  quarter?: string
  categories: "franco" | "anglo" | "bilingue"
  created_at: string
  payments: Payment[]
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  approvedTeachers: number
  pendingTeachers: number
  totalRevenue: number
  totalNotices: number
}

export interface RecentActivity {
  recentStudents: Student[]
  recentPayments: (Payment & {
    students: { full_name: string }
    teachers: { full_name: string }
  })[]
  recentTeachers: Teacher[]
}

// Form Types
export interface StudentFormData {
  full_name: string
  guardian_name: string
  guardian_phone: string
  class: string
  quarter: string
  user: string
  days_per_week: number
  categories: "franco" | "anglo" | "bilingue"
}

export interface TeacherFormData {
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
}

export interface AdminFormData {
  full_name: string
  role: "promoteur" | "chef coordonateur" | "coordonateur" | "IT supervisor"
  email: string
  about_me: string
  current_work: string
  profile_image_url: string
  user: string
  whatsapp_number: string
  password: string
}

export interface NoticeFormData {
  title: string
  content: string
  type: "text" | "image" | "video" | "link"
  image_url?: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter and Search Types
export interface StudentFilter {
  class?: string
  quarter?: string
  teacher_id?: string
  payment_status?: "paid" | "pending" | "overdue"
  categories?: "franco" | "anglo" | "bilingue"
}

export interface TeacherFilter {
  is_approved?: boolean
  category?: "anglo" | "franco"
  gender?: "male" | "female"
  subjects?: string[]
  location?: string[]
}

export interface PaymentFilter {
  teacher_id?: string
  student_id?: string
  date_from?: string
  date_to?: string
  status?: "pending" | "completed" | "failed"
}

// Export Types
export interface ExportOptions {
  format: "csv" | "excel" | "pdf"
  fields?: string[]
  filters?: any
  dateRange?: {
    from: string
    to: string
  }
}

// New Types for Student ID Generation and Payment Automation
export interface StudentIdGenerator {
  category: "franco" | "anglo" | "bilingue"
  count: number
}

export interface StudentIdConfig {
  anglo: { prefix: "ST00A"; count: number }
  franco: { prefix: "ST00F"; count: number }
  bilingue: { prefix: "ST00B"; count: number }
}

export interface PaymentSchedule {
  amount: number
  payment_date: string
  next_payment_due: string
  interval_months: number
}
