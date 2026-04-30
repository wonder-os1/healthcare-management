import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { authRoutes } from './routes/auth.routes'
import { patientRoutes } from './routes/patient.routes'
import { doctorRoutes } from './routes/doctor.routes'
import { appointmentRoutes } from './routes/appointment.routes'
import { prescriptionRoutes } from './routes/prescription.routes'
import { billingRoutes } from './routes/billing.routes'
import { medicalRecordRoutes } from './routes/medical-record.routes'
import { labRoutes } from './routes/lab.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { notificationRoutes } from './routes/notification.routes'
import { settingsRoutes } from './routes/settings.routes'
import { healthRoutes } from './routes/health.routes'
import { departmentRoutes } from './routes/department.routes'
import walkinRoutes from './routes/walkin.routes'
import teleconsultRoutes from './routes/teleconsult.routes'
import publicRoutes from './routes/public.routes'

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: env.APP_URL,
  credentials: true,
}))

// Parsing
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/medical-records', medicalRecordRoutes)
app.use('/api/lab-tests', labRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/walkin', walkinRoutes)
app.use('/api/teleconsult', teleconsultRoutes)
import { publicLimiter } from './middleware/rate-limiter'
app.use('/api/public', publicLimiter, publicRoutes)

// Error handler (must be last)
app.use(errorHandler)

export { app }
