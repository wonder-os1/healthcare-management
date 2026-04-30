'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ContactPage() {
  const { data: settings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: () => fetch(`${API}/public/settings`).then(r => r.json()).catch(() => ({})),
  })

  const clinic = settings as any || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            {clinic.clinicName || 'Our Clinic'}
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/doctors" className="text-gray-600 hover:text-blue-600">Doctors</Link>
            <Link href="/book" className="text-gray-600 hover:text-blue-600">Book Appointment</Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600">About</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
              <div className="space-y-4">
                {clinic.phone && (
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-lg">📞</span>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${clinic.phone}`} className="font-medium text-blue-600">
                        {clinic.phone}
                      </a>
                    </div>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-lg">📧</span>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${clinic.email}`} className="font-medium text-blue-600">
                        {clinic.email}
                      </a>
                    </div>
                  </div>
                )}
                {clinic.address && (
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-lg">📍</span>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{clinic.address}</p>
                      {clinic.city && (
                        <p className="text-sm text-gray-500">
                          {clinic.city}{clinic.state ? `, ${clinic.state}` : ''}{' '}
                          {clinic.pincode || ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {clinic.businessHours && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Business Hours</h2>
                <div className="space-y-2 text-sm">
                  {Object.entries(clinic.businessHours || {}).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{day}</span>
                      <span className="font-medium">{hours?.open ? `${hours.open} - ${hours.close}` : 'Closed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinic.whatsapp && (
              <a
                href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="block bg-green-600 text-white text-center py-3 rounded-xl font-medium hover:bg-green-700"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>

          <div className="space-y-6">
            {clinic.googleMapsUrl ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <iframe
                  src={clinic.googleMapsUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm h-[300px] flex items-center justify-center">
                <p className="text-gray-400">Map not configured</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Book an Appointment</h2>
              <p className="text-blue-800 text-sm mb-4">
                Skip the queue — book your appointment online and get confirmed instantly.
              </p>
              <Link
                href="/book"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
