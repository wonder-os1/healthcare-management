'use client'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PrescriptionDetail() {
  const { id } = useParams()
  const router = useRouter()
  const token = typeof window \!== 'undefined' ? localStorage.getItem('patientToken') : null
  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => fetch(`${apiUrl}/patient/prescriptions/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  })
  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
  if (!rx) return <p>Not found</p>
  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline">&larr; Back</button>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between mb-6"><div><h1 className="text-xl font-bold">Prescription</h1><p className="text-gray-500">Dr. {rx.doctor?.user?.name}</p></div><p className="text-sm text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</p></div>
        {rx.diagnosis&&<div className="mb-4"><h2 className="font-semibold text-sm text-gray-500 mb-1">Diagnosis</h2><p>{rx.diagnosis}</p></div>}
        <h2 className="font-semibold text-sm text-gray-500 mb-2">Medications</h2>
        <div className="space-y-3">{(rx.medications||[]).map((med:any,i:number)=>(<div key={i} className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between"><h3 className="font-medium">{med.name}</h3><span className="text-sm text-gray-500">{med.duration}</span></div><p className="text-sm text-gray-500">{med.dosage} · {med.frequency}</p>{med.instructions&&<p className="text-sm text-gray-400 mt-1">{med.instructions}</p>}</div>))}</div>
        {rx.notes&&<div className="mt-4 bg-yellow-50 rounded-lg p-4"><h2 className="font-semibold text-sm mb-1">Notes</h2><p className="text-sm">{rx.notes}</p></div>}
      </div>
    </div>
  )
}
