'use client'
import { useQuery } from '@tanstack/react-query'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientReports() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null
  const headers = { Authorization: `Bearer ${token}` }

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['patient-reports'],
    queryFn: () => fetch(`${API}/patient/reports`, { headers }).then(r => r.json()),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lab Reports</h1>
        <p className="text-gray-500">Your test results and lab reports</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(reports as any[]).map((report: any) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{report.testName || report.name || 'Lab Test'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                  {report.lab && ` · ${report.lab}`}
                </p>
                {report.result && (
                  <p className={`text-sm mt-1 ${report.isAbnormal ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                    Result: {report.result}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    report.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {report.status || 'Pending'}
                </span>
                {report.fileUrl && (
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
          {(reports as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-8">No lab reports found</p>
          )}
        </div>
      )}
    </div>
  )
}
