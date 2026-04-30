import Razorpay from 'razorpay'
import crypto from 'crypto'
import { env } from '../config/env'

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay | null {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    console.log('[razorpay] No credentials configured')
    return null
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  }

  return razorpayInstance
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function createOrder(amount: number, currency: string = 'INR', receipt: string) {
  const rp = getRazorpay()
  if (!rp) throw new Error('Razorpay not configured')

  return rp.orders.create({
    amount,
    currency,
    receipt,
  })
}
