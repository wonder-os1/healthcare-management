'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

type Step = 'department' | 'doctor' | 'slot' | 'details' | 'confirmation'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('department')
  const [department, setDepartment] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' })
  const [bookingResult, setBookingResult] = useState<any>(null)

  const { data: doctors = [] } = useQuery({
    queryKey: ['public-doctors', department],
    queryFn: () => {
      const params = department ? `?department=${department}` : ''
      return fetch(`${API}/public/doctors${params}`).then(r => r.json())
    },
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => fetch(`${API}/public/departments`).then(r => r.json()).catch(() => []),
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: () =>
      fetch(`${API}/public/slots?doctorId=${doctorId}&date=${selectedDate}`).then(r => r.json()),
    enabled: !!doctorId && !!selectedDate,
  })

  const bookMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setBookingResult(data)
      setStep('confirmation')
    },
  })

  const selectedDoctor = (doctors as any[]).find((d: any) => d.id === doctorId)

  const handleBook = () => {
    bookMut.mutate({
      doctorId,
      date: selectedDate,
      timeSlot: selectedSlot,
      patientName: form.name,
      patientPhone: form.phone,
      patientEmail: form.email,
      reason: form.reason,
    })
  }

  // Generate next 14 days for date selection
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Book Appointment</h1>
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            Back to Home
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex gap-2 mb-8">
          {(['department', 'doctor', 'slot', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  ['department', 'doctor', 'slot', 'details', 'confirmation'].indexOf(step) >= i
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1 capitalize">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12">
        {/* Step 1: Department */}
        {step === 'department' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Department</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(departments as any[]).length > 0
                ? (departments as any[]).map((dept: any) => (
                    <button
                      key={dept.id || dept.name}
                      onClick={() => {
                        setDepartment(dept.name || dept)
                        setStep('doctor')
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition hover:border-blue-500 ${
                        department === (dept.name || dept) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="font-medium">{dept.name || dept}</p>
                    </button>
                  ))
                : ['General Medicine', 'Pediatrics', 'Dermatology', 'ENT', 'Orthopedics', 'Gynecology'].map(
                    d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDepartment(d)
                          setStep('doctor')
                        }}
                        className={`text-left p-4 rounded-xl border-2 transition hover:border-blue-500 ${
                          department === d ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <p className="font-medium">{d}</p>
                      </button>
                    )
                  )}
            </div>
            <button
              onClick={() => {
                setDepartment('')
                setStep('doctor')
              }}
              className="text-blue-600 text-sm hover:underline"
            >
              Skip — show all doctors
            </button>
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 'doctor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Doctor</h2>
              <button onClick={() => setStep('department')} className="text-sm text-blue-600">
                Back
              </button>
            </div>
            {(doctors as any[]).length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No doctors available</p>
            ) : (
              <div className="space-y-3">
                {(doctors as any[]).map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setDoctorId(doc.id)
                      setStep('slot')
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition hover:border-blue-500 flex items-center gap-4 ${
                      doctorId === doc.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {doc.user?.name?.[0] || doc.name?.[0] || 'D'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dr. {doc.user?.name || doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.specialization} &middot; {doc.qualification}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        ₹{((doc.consultationFee || 0) / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{doc.slotDuration || 30} min</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time Slot */}
        {step === 'slot' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Date & Time</h2>
              <button onClick={() => setStep('doctor')} className="text-sm text-blue-600">
                Back
              </button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select Date</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map(d => {
                  const dateObj = new Date(d + 'T00:00:00')
                  const isToday = d === new Date().toISOString().split('T')[0]
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-16 p-2 rounded-xl text-center border-2 transition ${
                        selectedDate === d
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <p className="text-xs text-gray-500">
                        {dateObj.toLocaleDateString('en', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{dateObj.getDate()}</p>
                      <p className="text-xs text-gray-500">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en', { month: 'short' })}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Available Slots</h3>
                {(slots as any[]).length === 0 ? (
                  <p className="text-gray-500 py-4">No slots available for this date</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {(slots as any[]).map((slot: any) => {
                      const time = typeof slot === 'string' ? slot : slot.time || slot.startTime
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedSlot(time)}
                          className={`py-2 px-3 rounded-lg text-sm border-2 transition ${
                            selectedSlot === time
                              ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <button
                onClick={() => setStep('details')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 4: Patient Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Details</h2>
              <button onClick={() => setStep('slot')} className="text-sm text-blue-600">
                Back
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <textarea
                  className="w-full border rounded-lg px-4 py-2.5"
                  rows={3}
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly describe your concern..."
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-blue-900">Appointment Summary</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Doctor: Dr. {selectedDoctor?.user?.name || selectedDoctor?.name}</p>
                <p>Specialization: {selectedDoctor?.specialization}</p>
                <p>Date: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Time: {selectedSlot}</p>
                <p className="font-semibold">
                  Fee: ₹{((selectedDoctor?.consultationFee || 0) / 100).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={!form.name || !form.phone || bookMut.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {bookMut.isPending ? 'Booking...' : 'Confirm Appointment'}
            </button>
            {bookMut.isError && (
              <p className="text-red-600 text-sm text-center">Failed to book. Please try again.</p>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 'confirmation' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-green-600">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Appointment Confirmed!</h2>
              <p className="text-gray-500 mt-2">Your appointment has been successfully booked.</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-left max-w-md mx-auto space-y-3">
              {bookingResult?.tokenNumber && (
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Your Token</p>
                  <p className="text-4xl font-bold text-blue-600">#{bookingResult.tokenNumber}</p>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium">Dr. {selectedDoctor?.user?.name || selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setStep('department')
                  setDepartment('')
                  setDoctorId('')
                  setSelectedDate('')
                  setSelectedSlot('')
                  setForm({ name: '', phone: '', email: '', reason: '' })
                  setBookingResult(null)
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Book Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
