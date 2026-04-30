'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const { user } = useAuthStore()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats-report'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data.data
    },
  })

  if (user?.role !== 'ADMIN') {
    return <div className="py-20 text-center text-muted-foreground">Admin access required</div>
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  // Appointment breakdown for pie chart
  const appointmentData = [
    { name: 'Completed', value: stats.todayCompleted || 0 },
    { name: 'Cancelled', value: stats.todayCancelled || 0 },
    {
      name: 'Scheduled',
      value: Math.max(0, (stats.todayAppointments || 0) - (stats.todayCompleted || 0) - (stats.todayCancelled || 0)),
    },
  ].filter((d) => d.value > 0)

  // Revenue bar chart data
  const revenueData = stats.revenueByMonth || [
    { month: 'This Month', revenue: stats.monthlyRevenue || 0 },
  ]

  const growth = stats.revenueGrowth ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Patients</p>
            <p className="text-2xl font-bold mt-1 text-blue-600">{stats.totalPatients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Doctors</p>
            <p className="text-2xl font-bold mt-1 text-purple-600">{stats.totalDoctors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(stats.monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Revenue Growth</p>
            <p className={`text-2xl font-bold mt-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointments pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Appointments</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No appointments today
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {appointmentData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Monthly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString('en-IN')}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financials</CardTitle>
            <CardDescription>Revenue and pending payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Revenue</span>
                <span className="font-semibold">{formatCurrency(stats.monthlyRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Payments</span>
                <span className="font-semibold text-orange-600">{formatCurrency(stats.pendingPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collection Rate</span>
                <span className="font-semibold">
                  {stats.monthlyRevenue > 0
                    ? `${Math.round((stats.monthlyRevenue / (stats.monthlyRevenue + (stats.pendingPayments || 0))) * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment summary */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Summary</CardTitle>
            <CardDescription>Today&apos;s activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Today</span>
                <span className="font-semibold">{stats.todayAppointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-green-600">{stats.todayCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="font-semibold text-red-600">{stats.todayCancelled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-blue-600">
                  {Math.max(0, (stats.todayAppointments || 0) - (stats.todayCompleted || 0) - (stats.todayCancelled || 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
