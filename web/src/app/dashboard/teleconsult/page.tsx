'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function TeleconsultPage() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: sessions = [] } = useQuery({
    queryKey: ['teleconsult', date],
    queryFn: () => fetch(`${API}/teleconsult/sessions?date=${date}`, { headers }).then(r => r.json()),
  })

  const startMut = useMutation({
    mutationFn: (appointmentId: string) =>
      fetch(`${API}/teleconsult/session`, { method: 'POST', headers, body: JSON.stringify({ appointmentId }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teleconsult'] }),
  })

  const endMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      fetch(`${API}/teleconsult/${id}/end`, { method: 'PATCH', headers, body: JSON.stringify({ notes }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teleconsult'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teleconsultation</h1>
          <p className="text-gray-500">Video consultations</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      <div className="space-y-3">
        {(sessions as any[]).map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">{s.patient?.name}</h3>
              <p className="text-sm text-gray-500">
                Dr. {s.doctor?.user?.name} ·{' '}
                {s.startTime
                  ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Not started'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  s.status === 'SCHEDULED'
                    ? 'bg-blue-100 text-blue-700'
                    : s.status === 'IN_PROGRESS'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {s.status}
              </span>
              {s.status === 'SCHEDULED' && (
                <button
                  onClick={() => startMut.mutate(s.id)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm"
                >
                  Start Call
                </button>
              )}
              {s.status === 'IN_PROGRESS' && s.teleconsultUrl && (
                <a
                  href={s.teleconsultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm"
                >
                  Join
                </a>
              )}
              {s.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => endMut.mutate({ id: s.id, notes: '' })}
                  className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm"
                >
                  End
                </button>
              )}
            </div>
          </div>
        ))}
        {(sessions as any[]).length === 0 && (
          <p className="text-center text-gray-500 py-8">No sessions for this date</p>
        )}
      </div>
    </div>
  )
}
