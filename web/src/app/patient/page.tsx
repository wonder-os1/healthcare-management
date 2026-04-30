'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientDashboard() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null
  const headers = { Authorization: `Bearer ${token}` }

  const { data: stats } = useQuery({
    queryKey: ['patient-dashboard'],
    queryFn: () => fetch(`${API}/patient/dashboard`, { headers }).then(r => r.json()).catch(() => ({})),
  })

  const { data: appointmentsData } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => fetch(`${API}/patient/appointments?status=SCHEDULED&limit=3`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
  })

  const { data: prescriptionsData } = useQuery({
    queryKey: ['patient-recent-prescriptions'],
    queryFn: () => fetch(`${API}/patient/prescriptions?limit=3`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
  })

  const appointments = appointmentsData?.data || []
  const prescriptions = prescriptionsData?.data || []
  const s = stats?.data || stats || {}

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back{s.name ? `, ${s.name}` : ''}</h1>
        <p className="text-blue-100 mt-1">Here&apos;s your health summary at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Upcoming Appointments</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">{s.upcoming || s.upcomingAppointments || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">Active Prescriptions</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{s.prescriptions || s.activePrescriptions || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500 font-medium">Pending Bills</p>
          <p className="text-3xl font-bold mt-2 text-amber-600">{s.pendingBills || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-medium">Lab Reports</p>
          <p className="text-3xl font-bold mt-2 text-purple-600">{s.reports || s.labReports || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Upcoming Appointments</h2>
            <Link href="/patient/appointments" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
              <Link href="/book" className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Book Now</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 3).map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {apt.doctor?.user?.name?.[0] || apt.doctorName?.[0] || 'D'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Dr. {apt.doctor?.user?.name || apt.doctorName || 'Doctor'}</p>
                    <p className="text-xs text-gray-500">{apt.doctor?.specialization || apt.department || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-gray-500">{apt.startTime || apt.time || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/book" className="flex flex-col items-center gap-2 bg-blue-50 text-blue-700 p-4 rounded-xl text-sm hover:bg-blue-100 transition-colors">
              <span className="text-2xl">📅</span>
              <span className="font-medium">Book Appointment</span>
            </Link>
            <Link href="/patient/prescriptions" className="flex flex-col items-center gap-2 bg-green-50 text-green-700 p-4 rounded-xl text-sm hover:bg-green-100 transition-colors">
              <span className="text-2xl">💊</span>
              <span className="font-medium">Prescriptions</span>
            </Link>
            <Link href="/patient/records" className="flex flex-col items-center gap-2 bg-purple-50 text-purple-700 p-4 rounded-xl text-sm hover:bg-purple-100 transition-colors">
              <span className="text-2xl">📋</span>
              <span className="font-medium">Medical Records</span>
            </Link>
            <Link href="/patient/reports" className="flex flex-col items-center gap-2 bg-amber-50 text-amber-700 p-4 rounded-xl text-sm hover:bg-amber-100 transition-colors">
              <span className="text-2xl">🔬</span>
              <span className="font-medium">Lab Reports</span>
            </Link>
            <Link href="/patient/bills" className="flex flex-col items-center gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm hover:bg-red-100 transition-colors">
              <span className="text-2xl">💳</span>
              <span className="font-medium">Pay Bills</span>
            </Link>
            <Link href="/contact" className="flex flex-col items-center gap-2 bg-gray-50 text-gray-700 p-4 rounded-xl text-sm hover:bg-gray-100 transition-colors">
              <span className="text-2xl">📞</span>
              <span className="font-medium">Contact Clinic</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Prescriptions</h2>
          <Link href="/patient/prescriptions" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        {prescriptions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No prescriptions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Doctor</th>
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium">Medicines</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {prescriptions.slice(0, 3).map((rx: any) => (
                  <tr key={rx.id} className="hover:bg-gray-50">
                    <td className="py-3">{new Date(rx.createdAt || rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3">Dr. {rx.doctor?.user?.name || rx.doctorName || '—'}</td>
                    <td className="py-3">{rx.diagnosis || '—'}</td>
                    <td className="py-3">{rx.medicines?.length || rx.items?.length || 0} items</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
