import { z } from 'zod'

// ---- Auth ----
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  role: z.enum(['DOCTOR', 'STAFF', 'PATIENT']).default('PATIENT'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ---- Patient ----
export const createPatientSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

export const updatePatientSchema = createPatientSchema.partial()

// ---- Doctor ----
export const createDoctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).default([]),
  experience: z.number().int().min(0).default(0),
  consultationFee: z.number().int().min(0).default(50000),
  bio: z.string().optional(),
  departmentId: z.string().optional(),
  schedule: z.record(z.any()).optional(),
})

export const updateDoctorSchema = createDoctorSchema.partial()

// ---- Appointment ----
export const createAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.string().default('consultation'),
  reason: z.string().optional(),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
})

// ---- Prescription ----
export const createPrescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(1),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  items: z.array(z.object({
    medicineId: z.string().optional(),
    medicineName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })).min(1),
})

// ---- Billing ----
export const createInvoiceSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().int().min(0),
  })).min(1),
  discount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

export const createPaymentSchema = z.object({
  invoiceId: z.string(),
  method: z.enum(['razorpay', 'cash', 'card', 'upi']).default('razorpay'),
})

// ---- Medical Record ----
export const createMedicalRecordSchema = z.object({
  patientId: z.string(),
  type: z.enum(['CONSULTATION', 'LAB_REPORT', 'IMAGING', 'DISCHARGE_SUMMARY', 'REFERRAL', 'OTHER']),
  title: z.string().min(1),
  description: z.string().optional(),
})

// ---- Lab Test ----
export const createLabTestSchema = z.object({
  patientId: z.string(),
  testName: z.string().min(1),
  testCode: z.string().optional(),
  category: z.string().optional(),
  orderedBy: z.string().optional(),
  notes: z.string().optional(),
})

export const updateLabTestSchema = z.object({
  status: z.enum(['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED']).optional(),
  results: z.any().optional(),
  notes: z.string().optional(),
})

// ---- Department ----
export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

// ---- Settings ----
export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.any(),
})

// ---- Pagination ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
