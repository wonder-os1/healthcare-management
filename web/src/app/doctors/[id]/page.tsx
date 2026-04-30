"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useParams } from "next/navigation"
import Link from "next/link"
import { formatCurrency, getInitials } from "@/lib/utils"

export default function DoctorDetailPage() {
  const params = useParams()
  const doctorId = params.id as string

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: async () => {
      const res = await api.get("/public/doctors")
      return res.data.data
    },
  })

  const doctor = (doctors || []).find((d: any) => d.id === doctorId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Not Found</h2>
          <Link href="/doctors" className="text-blue-600 hover:underline">Back to Doctors</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/doctors" className="text-blue-600 hover:underline text-sm mb-6 inline-block">Back to Doctors</Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {getInitials(doctor.user?.name || "Dr")}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{doctor.user?.name}</h1>
                <p className="text-blue-100 text-lg mt-1">{doctor.specialization}</p>
                {doctor.department && <p className="text-blue-200 text-sm mt-1">{doctor.department.name}</p>}
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h2>
                <div className="space-y-3">
                  {doctor.qualifications && (<div><p className="text-sm text-gray-500">Qualifications</p><p className="text-gray-900">{doctor.qualifications}</p></div>)}
                  {doctor.experience && (<div><p className="text-sm text-gray-500">Experience</p><p className="text-gray-900">{doctor.experience} years</p></div>)}
                  {doctor.licenseNumber && (<div><p className="text-sm text-gray-500">License Number</p><p className="text-gray-900">{doctor.licenseNumber}</p></div>)}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultation</h2>
                <div className="space-y-3">
                  <div><p className="text-sm text-gray-500">Consultation Fee</p><p className="text-2xl font-bold text-green-700">{formatCurrency(doctor.consultationFee)}</p></div>
                  <div>
                    <p className="text-sm text-gray-500">Availability</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${doctor.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {doctor.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {doctor.bio && (<div className="mt-8"><h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2><p className="text-gray-600 leading-relaxed">{doctor.bio}</p></div>)}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link href={`/book?doctorId=${doctor.id}`} className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Book with this Doctor</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
