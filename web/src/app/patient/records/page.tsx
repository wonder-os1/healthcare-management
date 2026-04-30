'use client'
import { useQuery } from '@tanstack/react-query'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function MedicalRecords() {
  const token = typeof window \!== 'undefined' ? localStorage.getItem('patientToken') : null
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['patient', 'records'],
    queryFn: () => fetch(`${apiUrl}/patient/records`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  })
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Medical Records</h1>
      {isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl"/>)}</div> : (
        <div className="space-y-3">{(records as any[]).map((r:any)=>(<div key={r.id} className="bg-white rounded-xl shadow-sm p-4"><div className="flex justify-between"><div><h3 className="font-medium">{r.title||r.type}</h3><p className="text-sm text-gray-500">Dr. {r.doctor?.user?.name} · {new Date(r.date||r.createdAt).toLocaleDateString()}</p></div>{r.fileUrl&&<a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">Download</a>}</div></div>))}{records.length===0&&<p className="text-center text-gray-500 py-8">No records found</p>}</div>
      )}
    </div>
  )
}
