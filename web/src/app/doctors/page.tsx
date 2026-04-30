"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { formatCurrency, getInitials } from '@/lib/utils'

export default function DoctorsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: async () => {
      const res = await api.get('/public/doctors')
      return res.data.data
    },
  })

  const doctors = (data || []).filter((doc: any) =>
    doc.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Doctors</h1>
        <p className="text-gray-600 mb-6">Find the right specialist for your needs</p>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No doctors found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor: any) => (
              <div key={doctor.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                    {getInitials(doctor.user?.name || 'Dr')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{doctor.user?.name}</h3>
                    <p className="text-blue-600 text-sm">{doctor.specialization}</p>
                  </div>
                </div>
                {doctor.qualifications && (
                  <p className="text-gray-600 text-sm mb-2"><span className="font-medium">Qualifications:</span> {doctor.qualifications}</p>
                )}
                {doctor.experience && (
                  <p className="text-gray-600 text-sm mb-2"><span className="font-medium">Experience:</span> {doctor.experience} years</p>
                )}
                {doctor.department && (
                  <p className="text-gray-600 text-sm mb-2"><span className="font-medium">Department:</span> {doctor.department.name}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-lg font-semibold text-green-700">{formatCurrency(doctor.consultationFee)}</span>
                  <Link href={`/book?doctorId=${doctor.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Book Appointment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
