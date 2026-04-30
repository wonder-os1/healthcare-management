import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { unreadOnly } = req.query

    const where: any = { userId: req.user!.userId }
    if (unreadOnly === 'true') where.isRead = false

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      }),
    ])

    res.json({ success: true, data: { notifications, unreadCount } })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export { router as notificationRoutes }
