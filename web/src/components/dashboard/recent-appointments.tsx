'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, formatTime, getInitials, getStatusColor } from '@/lib/utils'
import type { Appointment } from '@/types'

interface RecentAppointmentsProps {
  appointments: Appointment[]
}

export function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Appointments</CardTitle>
        <Link href="/dashboard/appointments" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No appointments today</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {apt.patient?.user ? getInitials(apt.patient.user.name) : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {apt.patient?.user?.name || 'Patient'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(apt.date)} at {formatTime(apt.startTime)}
                    {apt.doctor?.user && ` — Dr. ${apt.doctor.user.name}`}
                  </p>
                </div>
                <Badge className={getStatusColor(apt.status)} variant="outline">
                  {apt.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
