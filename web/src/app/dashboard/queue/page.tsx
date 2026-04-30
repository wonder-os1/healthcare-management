'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function QueuePage() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientName: '', phone: '', doctorId: '', symptoms: '' })

  const { data: queue = [] } = useQuery({
    queryKey: ['walkin-queue'],
    queryFn: () => fetch(`${API}/walkin/queue`, { headers }).then(r => r.json()),
    refetchInterval: 10000,
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => fetch(`${API}/doctors`, { headers }).then(r => r.json()),
  })

  const addMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/walkin`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['walkin-queue'] })
      setShowForm(false)
      setForm({ patientName: '', phone: '', doctorId: '', symptoms: '' })
    },
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`${API}/walkin/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['walkin-queue'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Walk-in Queue</h1>
          <p className="text-gray-500">{(queue as any[]).length} patients</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : 'Add Walk-in'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border rounded-lg px-4 py-2"
                value={form.patientName}
                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                className="w-full border rounded-lg px-4 py-2"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Doctor</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={form.doctorId}
                onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
              >
                <option value="">Select</option>
                {(doctors as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>Dr. {d.user?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Symptoms</label>
              <input
                className="w-full border rounded-lg px-4 py-2"
                value={form.symptoms}
                onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              />
            </div>
          </div>
          <button
            onClick={() => addMut.mutate(form)}
            disabled={addMut.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {addMut.isPending ? 'Registering...' : 'Register Patient'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(queue as any[]).map((item: any) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                {item.tokenNumber}
              </div>
              <div>
                <h3 className="font-medium">{item.patient?.name || item.patientName}</h3>
                <p className="text-sm text-gray-500">
                  Dr. {item.doctor?.user?.name} · {item.symptoms || 'No symptoms noted'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'CHECKED_IN'
                    ? 'bg-yellow-100 text-yellow-700'
                    : item.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {item.status}
              </span>
              {item.status === 'CHECKED_IN' && (
                <button
                  onClick={() => statusMut.mutate({ id: item.id, status: 'IN_PROGRESS' })}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg"
                >
                  Start
                </button>
              )}
              {item.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => statusMut.mutate({ id: item.id, status: 'COMPLETED' })}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {(queue as any[]).length === 0 && (
          <p className="text-center text-gray-500 py-8">Queue is empty</p>
        )}
      </div>
    </div>
  )
}
