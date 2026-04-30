import { Router, Response, Request } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createInvoiceSchema, createPaymentSchema, paginationSchema } from '../validators'
import { createOrder, verifyWebhookSignature } from '../utils/razorpay'
import { sendPaymentReceipt } from '../utils/email'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/billing/invoices
router.get('/invoices', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where: any = {}
    if (req.user!.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
      if (patient) where.patientId = patient.id
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ])

    res.json({
      success: true,
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/invoices
router.post('/invoices', authenticate, requireStaff, validate(createInvoiceSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { patientId, appointmentId, items, discount, notes } = req.body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)
    const tax = Math.round(subtotal * 0.18) // 18% GST
    const total = subtotal + tax - (discount || 0)

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        appointmentId,
        items: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
        subtotal,
        tax,
        discount: discount || 0,
        total,
        notes,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    res.status(201).json({ success: true, data: invoice })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/payments
router.post('/payments', authenticate, validate(createPaymentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId, method } = req.body

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
    })

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' })
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'Invoice already paid' })
    }

    if (method === 'razorpay') {
      // Create Razorpay order
      try {
        const order = await createOrder(invoice.total, 'INR', invoice.invoiceNumber)

        const payment = await prisma.payment.create({
          data: {
            invoiceId,
            amount: invoice.total,
            method: 'razorpay',
            razorpayOrderId: order.id,
          },
        })

        return res.json({
          success: true,
          data: {
            payment,
            razorpayOrder: order,
            key: process.env.RAZORPAY_KEY_ID,
          },
        })
      } catch {
        return res.status(500).json({ success: false, error: 'Failed to create payment order' })
      }
    }

    // Cash/Card/UPI — mark as paid directly
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: invoice.total,
        method,
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    })

    // Send receipt
    const formatAmount = `₹${(invoice.total / 100).toLocaleString('en-IN')}`
    sendPaymentReceipt(invoice.patient.user.email, {
      patientName: invoice.patient.user.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: formatAmount,
    }).catch(console.error)

    res.json({ success: true, data: payment })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/webhooks/razorpay
router.post('/webhooks/razorpay', async (req: Request, res: Response, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing signature' })
    }

    const body = JSON.stringify(req.body)
    if (!verifyWebhookSignature(body, signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' })
    }

    const event = req.body.event
    const paymentEntity = req.body.payload?.payment?.entity

    if (event === 'payment.captured' && paymentEntity) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            razorpayPaymentId: paymentEntity.id,
            paidAt: new Date(),
          },
        })

        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: 'PAID' },
        })
      }
    }

    if (event === 'payment.failed' && paymentEntity) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        })
      }
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export { router as billingRoutes }
