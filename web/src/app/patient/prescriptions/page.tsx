'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientPrescriptions() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['patient', 'prescriptions'],
    queryFn: () => fetch(`${apiUrl}/patient/prescriptions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  })
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Prescriptions</h1>
      {isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-28 bg-gray-200 animate-pulse rounded-xl"/>)}</div> : (
        <div className="space-y-3">{(prescriptions as any[]).map((rx: any) => (
          <Link key={rx.id} href={`/patient/prescriptions/${rx.id}`}>
            <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between"><div><h3 className="font-medium">Dr. {rx.doctor?.user?.name}</h3><p className="text-sm text-gray-500">{rx.diagnosis||'Consultation'} · {rx.medications?.length||0} meds</p></div><div className="text-right"><p className="text-sm text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</p><span className={`px-2 py-0.5 rounded-full text-xs ${rx.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{rx.isActive?'Active':'Completed'}</span></div></div>
            </div>
          </Link>
        ))}{prescriptions.length===0&&<p className="text-center text-gray-500 py-8">No prescriptions</p>}</div>
      )}
    </div>
  )
}
