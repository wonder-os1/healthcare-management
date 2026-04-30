import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { updateSettingSchema } from '../validators'

const router = Router()

// GET /api/settings
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany()
    const settingsMap: Record<string, any> = {}
    settings.forEach((s) => { settingsMap[s.key] = s.value })
    res.json({ success: true, data: settingsMap })
  } catch (error) {
    next(error)
  }
})

// PUT /api/settings
router.put('/', authenticate, requireAdmin, validate(updateSettingSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { key, value } = req.body

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'UPDATE', entity: 'setting', entityId: setting.id },
    })

    res.json({ success: true, data: setting })
  } catch (error) {
    next(error)
  }
})

export { router as settingsRoutes }
