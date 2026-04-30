'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientAppointments() {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming')
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient', 'appointments', tab],
    queryFn: () => fetch(`${apiUrl}/patient/appointments?status=${tab}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">My Appointments</h1><a href="/book" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Book New</a></div>
      <div className="flex gap-2">
        <button onClick={() => setTab('upcoming')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Upcoming</button>
        <button onClick={() => setTab('past')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'past' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Past</button>
      </div>
      {isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl"/>)}</div> : (
        <div className="space-y-3">{(appointments as any[]).map((apt: any) => (
          <div key={apt.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div><h3 className="font-medium">Dr. {apt.doctor?.user?.name}</h3><p className="text-sm text-gray-500">{apt.doctor?.specialization} · {new Date(apt.date).toLocaleDateString()}</p></div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status==='SCHEDULED'?'bg-blue-100 text-blue-700':apt.status==='COMPLETED'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{apt.status}</span>
          </div>
        ))}{appointments.length===0&&<p className="text-center text-gray-500 py-8">No {tab} appointments</p>}</div>
      )}
    </div>
  )
}
