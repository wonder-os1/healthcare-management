'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/patient', label: 'Dashboard', icon: '🏠' },
  { href: '/patient/appointments', label: 'Appointments', icon: '📅' },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: '💊' },
  { href: '/patient/records', label: 'Records', icon: '📋' },
  { href: '/patient/bills', label: 'Bills', icon: '💳' },
  { href: '/patient/reports', label: 'Lab Reports', icon: '🔬' },
]

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">Patient Portal</h1>
        <button className="text-sm text-gray-500 hover:text-gray-700">Sign Out</button>
      </header>
      <div className="flex">
        <nav className="w-64 bg-white border-r min-h[calc(100vh-65px)] p-4">
          <ul className="space-y-1">{nav.map(item => (
            <li key={item.href}><Link href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${pathname === item.href ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}><span>{item.icon}</span>{item.label}</Link></li>
          ))}</ul>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
