'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentAppointments } from '@/components/dashboard/recent-appointments'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data.data
    },
  })

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatsCards stats={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentAppointments appointments={stats.recentAppointments || []} />
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/dashboard/appointments" className="rounded-lg border p-4 text-center hover:bg-muted transition-colors">
              <p className="text-sm font-medium">New Appointment</p>
              <p className="text-xs text-muted-foreground">Book a slot</p>
            </a>
            <a href="/dashboard/patients" className="rounded-lg border p-4 text-center hover:bg-muted transition-colors">
              <p className="text-sm font-medium">Add Patient</p>
              <p className="text-xs text-muted-foreground">Register new</p>
            </a>
            <a href="/dashboard/prescriptions" className="rounded-lg border p-4 text-center hover:bg-muted transition-colors">
              <p className="text-sm font-medium">Prescriptions</p>
              <p className="text-xs text-muted-foreground">View / create</p>
            </a>
            <a href="/dashboard/billing" className="rounded-lg border p-4 text-center hover:bg-muted transition-colors">
              <p className="text-sm font-medium">Billing</p>
              <p className="text-xs text-muted-foreground">Invoices</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
