export type UserRole = 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  lastLoginAt?: string
  patient?: Patient
  doctor?: Doctor
}

export interface Patient {
  id: string
  userId: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  address?: string
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  user?: User
  createdAt: string
}

export interface Doctor {
  id: string
  userId: string
  specialization: string
  qualifications: string
  licenseNumber: string
  consultationFee: number
  departmentId?: string
  schedule: Record<string, { start: string; end: string }>
  isAvailable: boolean
  user?: User
  department?: Department
}

export interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  type: string
  reason?: string
  notes?: string
  patient?: Patient
  doctor?: Doctor
  createdAt: string
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export interface Prescription {
  id: string
  appointmentId?: string
  patientId: string
  doctorId: string
  diagnosis: string
  notes?: string
  items: PrescriptionItem[]
  patient?: Patient
  doctor?: Doctor
  appointment?: Appointment
  createdAt: string
}

export interface PrescriptionItem {
  id: string
  medicineId?: string
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  medicine?: Medicine
}

export interface Medicine {
  id: string
  name: string
  genericName?: string
  type: string
  manufacturer?: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  type: string
  title: string
  description?: string
  attachmentUrl?: string
  patient?: Patient
  doctor?: Doctor
  createdAt: string
}

export interface Invoice {
  id: string
  patientId: string
  appointmentId?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  dueDate?: string
  patient?: Patient
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: string
  status: string
  transactionId?: string
  invoice?: Invoice
  createdAt: string
}

export interface LabTest {
  id: string
  patientId: string
  doctorId: string
  testName: string
  testType: string
  status: string
  result?: string
  notes?: string
  patient?: Patient
  doctor?: Doctor
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  todayAppointments: number
  todayCompleted: number
  todayCancelled: number
  monthlyRevenue: number
  revenueGrowth: number
  pendingPayments: number
  recentAppointments: Appointment[]
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
