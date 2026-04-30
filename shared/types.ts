/** Shared types used across web, api, and mobile layers */

export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  qualification: string
  registrationNo: string // Medical council registration
  consultationFee: number
  availability: WeeklySchedule
  isActive: boolean
  rating: number
}

export interface WeeklySchedule {
  [day: string]: { start: string; end: string; available: boolean }
}

export interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  bloodGroup?: string
  allergies: string[]
  emergencyContact?: { name: string; phone: string; relation: string }
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  type: 'consultation' | 'follow_up' | 'procedure' | 'teleconsult'
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  symptoms?: string
  notes?: string
  fee: number
}

export interface Prescription {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  diagnosis: string
  medicines: Medicine[]
  instructions: string
  followUpDate?: string
  createdAt: string
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  beforeFood: boolean
  notes?: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  type: 'lab_report' | 'imaging' | 'prescription' | 'discharge_summary' | 'other'
  title: string
  fileUrl: string
  notes?: string
  date: string
}

export interface LabTest {
  id: string
  patientId: string
  appointmentId?: string
  testName: string
  status: 'ordered' | 'sample_collected' | 'processing' | 'completed'
  result?: string
  resultFileUrl?: string
  orderedBy: string
  createdAt: string
}

export interface FeatureFlags {
  appointmentBooking: boolean
  patientRecords: boolean
  prescriptionManagement: boolean
  billingInsurance: boolean
  telemedicine: boolean
  labIntegration: boolean
}
