import { Resend } from 'resend'
import { env } from '../config/env'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    console.log('[email] Skipping (no API key):', { to, subject })
    return { success: true, mock: true }
  }

  try {
    const data = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('[email] Send failed:', error)
    return { success: false, error }
  }
}

export async function sendAppointmentConfirmation(
  email: string,
  details: { patientName: string; doctorName: string; date: string; time: string }
) {
  return sendEmail({
    to: email,
    subject: `Appointment Confirmed - ${env.APP_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Appointment Confirmed</h2>
        <p>Hi ${details.patientName},</p>
        <p>Your appointment has been confirmed:</p>
        <ul>
          <li><strong>Doctor:</strong> ${details.doctorName}</li>
          <li><strong>Date:</strong> ${details.date}</li>
          <li><strong>Time:</strong> ${details.time}</li>
        </ul>
        <p>— ${env.APP_NAME}</p>
      </div>
    `,
  })
}

export async function sendPaymentReceipt(
  email: string,
  details: { patientName: string; invoiceNumber: string; amount: string }
) {
  return sendEmail({
    to: email,
    subject: `Payment Receipt ${details.invoiceNumber} - ${env.APP_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Payment Received</h2>
        <p>Hi ${details.patientName},</p>
        <p>We received your payment of <strong>${details.amount}</strong>.</p>
        <p>Invoice: ${details.invoiceNumber}</p>
        <p>— ${env.APP_NAME}</p>
      </div>
    `,
  })
}
