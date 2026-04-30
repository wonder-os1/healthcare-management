'use client'
import { useQuery } from '@tanstack/react-query'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientBills() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null
  const headers = { Authorization: `Bearer ${token}` }

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['patient-bills'],
    queryFn: () => fetch(`${API}/patient/bills`, { headers }).then(r => r.json()),
  })

  const totalPending = (bills as any[])
    .filter((b: any) => b.status === 'PENDING')
    .reduce((sum: number, b: any) => sum + (b.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bills & Payments</h1>
          <p className="text-gray-500">{(bills as any[]).length} bills</p>
        </div>
        {totalPending > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <p className="text-sm text-orange-700">
              Pending: <span className="font-bold">₹{(totalPending / 100).toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(bills as any[]).map((bill: any) => (
            <div key={bill.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{bill.description || 'Consultation'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(bill.createdAt).toLocaleDateString()} · Dr. {bill.doctor?.user?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold">₹{((bill.amount || 0) / 100).toLocaleString()}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {bill.status}
                </span>
              </div>
            </div>
          ))}
          {(bills as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-8">No bills found</p>
          )}
        </div>
      )}
    </div>
  )
}
