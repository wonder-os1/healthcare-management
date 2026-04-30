import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createDepartmentSchema } from '../validators'

const router = Router()

// GET /api/departments
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: { _count: { select: { doctors: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: departments })
  } catch (error) {
    next(error)
  }
})

// POST /api/departments
router.post('/', authenticate, requireAdmin, validate(createDepartmentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const department = await prisma.department.create({ data: req.body })
    res.status(201).json({ success: true, data: department })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/departments/:id
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json({ success: true, data: department })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/departments/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.department.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true, message: 'Department deactivated' })
  } catch (error) {
    next(error)
  }
})

export { router as departmentRoutes }
