export type UserRole = 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
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
  user?: User
  createdAt: string
}

export interface Doctor {
  id: string
  userId: string
  specialization: string
  qualifications: string
  licenseNumber?: string
  consultationFee: number
  isAvailable: boolean
  user?: User
  department?: { id: string; name: string }
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  status: string
  type: string
  reason?: string
  notes?: string
  patient?: Patient
  doctor?: Doctor
  createdAt: string
}

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  diagnosis: string
  notes?: string
  items: PrescriptionItem[]
  patient?: Patient
  doctor?: Doctor
  createdAt: string
}

export interface PrescriptionItem {
  id: string
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  type: string
  title: string
  description?: string
  doctor?: Doctor
  createdAt: string
}

export interface Notification {
  id: string
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
  monthlyRevenue: number
  recentAppointments: Appointment[]
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}
