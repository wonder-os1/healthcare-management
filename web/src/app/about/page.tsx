'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function AboutPage() {
  const { data: settings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: () => fetch(`${API}/public/settings`).then(r => r.json()).catch(() => ({})),
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: () => fetch(`${API}/public/doctors`).then(r => r.json()).catch(() => []),
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
            <Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{clinic.clinicName || 'About Our Clinic'}</h1>
          {clinic.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{clinic.description}</p>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">{(doctors as any[]).length}+</p>
            <p className="text-sm text-gray-500 mt-1">Expert Doctors</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">10K+</p>
            <p className="text-sm text-gray-500 mt-1">Patients Served</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">15+</p>
            <p className="text-sm text-gray-500 mt-1">Specializations</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">4.8</p>
            <p className="text-sm text-gray-500 mt-1">Patient Rating</p>
          </div>
        </section>

        {/* Our Team */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Our Medical Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(doctors as any[]).slice(0, 6).map((doc: any) => (
              <Link
                key={doc.id}
                href={`/doctors/${doc.id}`}
                className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {doc.user?.name?.[0] || doc.name?.[0] || 'D'}
                  </span>
                </div>
                <h3 className="font-semibold">Dr. {doc.user?.name || doc.name}</h3>
                <p className="text-sm text-blue-600">{doc.specialization}</p>
                <p className="text-xs text-gray-500 mt-1">{doc.qualification}</p>
                {doc.experience && (
                  <p className="text-xs text-gray-400 mt-1">{doc.experience} years experience</p>
                )}
              </Link>
            ))}
          </div>
          {(doctors as any[]).length > 6 && (
            <div className="text-center mt-6">
              <Link href="/doctors" className="text-blue-600 hover:underline text-sm font-medium">
                View all doctors
              </Link>
            </div>
          )}
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Outpatient Consultations', desc: 'Expert medical consultations across multiple specializations' },
              { title: 'Walk-in Services', desc: 'No appointment needed — walk in and get immediate care' },
              { title: 'Online Booking', desc: 'Book appointments online at your convenience, 24/7' },
              { title: 'Lab & Diagnostics', desc: 'In-house laboratory and diagnostic imaging services' },
              { title: 'Teleconsultation', desc: 'Video consultations from the comfort of your home' },
              { title: 'Patient Portal', desc: 'Access medical records, prescriptions, and bills online' },
            ].map((svc, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-2">{svc.title}</h3>
                <p className="text-sm text-gray-500">{svc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Visit Us?</h2>
          <p className="text-blue-100 mb-6">Book your appointment online or walk in — we are here for you.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/book"
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-medium hover:bg-blue-50"
            >
              Book Appointment
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
