import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { hashPassword, comparePassword } from '../utils/password'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import { validate } from '../middleware/validate'
import { authenticate, AuthRequest } from '../middleware/auth'
import { authLimiter } from '../middleware/rate-limiter'
import { registerSchema, loginSchema } from '../validators'
import { env } from '../config/env'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    // If patient role, create patient profile
    if (role === 'PATIENT') {
      await prisma.patient.create({ data: { userId: user.id } })
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role })

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'REGISTER', entity: 'user', entityId: user.id },
    })

    res.cookie('token', token, COOKIE_OPTIONS)
    res.status(201).json({ success: true, data: { user, token, refreshToken } })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role })

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id },
    })

    res.cookie('token', token, COOKIE_OPTIONS)
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        token,
        refreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, name: true, email: true, phone: true, role: true, avatar: true,
        patient: true,
        doctor: { include: { department: true } },
      },
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const token = generateToken({ userId: req.user!.userId, email: req.user!.email, role: req.user!.role })
    res.json({ success: true, data: { token } })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ success: true, message: 'Logged out successfully' })
})

export { router as authRoutes }
