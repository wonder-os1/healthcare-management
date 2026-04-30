'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Calendar as CalIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, getInitials, getStatusColor } from '@/lib/utils'

export default function AppointmentsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    patientId: '', doctorId: '', date: '', startTime: '', type: 'CONSULTATION', reason: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await api.get(`/appointments?${params}`)
      return data
    },
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await api.get('/doctors?limit=100')
      return data.data
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data } = await api.get('/patients?limit=100')
      return data.data
    },
    enabled: user?.role !== 'PATIENT',
  })

  const [slots, setSlots] = useState<any[]>([])
  const fetchSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return
    try {
      const { data } = await api.get(`/doctors/${doctorId}/slots?date=${date}`)
      setSlots(data.data || [])
    } catch { setSlots([]) }
  }

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const slot = slots.find((s: any) => s.start === payload.startTime)
      const { data } = await api.post('/appointments', {
        ...payload,
        endTime: slot?.end || payload.startTime,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setDialogOpen(false)
      setForm({ patientId: '', doctorId: '', date: '', startTime: '', type: 'CONSULTATION', reason: '' })
      setSlots([])
      toast({ title: 'Appointment booked successfully' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to book appointment' })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/appointments/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Status updated' })
    },
  })

  const appointments = data?.data || []
  const pagination = data?.pagination
  const canCreate = user && ['ADMIN', 'STAFF', 'DOCTOR'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Book Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {(patientsData || []).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.user?.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor *</Label>
                    <Select value={form.doctorId} onValueChange={(v) => {
                      setForm({ ...form, doctorId: v, startTime: '' })
                      if (form.date) fetchSlots(v, form.date)
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        {(doctorsData || []).map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>Dr. {d.user?.name} — {d.specialization}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" value={form.date} onChange={(e) => {
                      setForm({ ...form, date: e.target.value, startTime: '' })
                      if (form.doctorId) fetchSlots(form.doctorId, e.target.value)
                    }} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Slot *</Label>
                    <Select value={form.startTime} onValueChange={(v) => setForm({ ...form, startTime: v })}>
                      <SelectTrigger><SelectValue placeholder={slots.length ? 'Pick slot' : 'Select doctor & date'} /></SelectTrigger>
                      <SelectContent>
                        {slots.filter((s: any) => s.available).map((s: any) => (
                          <SelectItem key={s.start} value={s.start}>{formatTime(s.start)} — {formatTime(s.end)}</SelectItem>
                        ))}
                        {slots.length > 0 && slots.every((s: any) => !s.available) && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No slots available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      <SelectItem value="CHECKUP">Checkup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit..." />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Booking...' : 'Book Appointment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : appointments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No appointments found</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  {canCreate && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt: any) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(apt.patient?.user?.name || 'P')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{apt.patient?.user?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">Dr. {apt.doctor?.user?.name}</TableCell>
                    <TableCell className="text-sm">{formatDate(apt.date)}<br /><span className="text-muted-foreground">{formatTime(apt.startTime)}</span></TableCell>
                    <TableCell><Badge variant="outline">{apt.type}</Badge></TableCell>
                    <TableCell><Badge className={getStatusColor(apt.status)} variant="outline">{apt.status.replace('_', ' ')}</Badge></TableCell>
                    {canCreate && (
                      <TableCell>
                        {apt.status === 'SCHEDULED' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}>Confirm</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CANCELLED' })}>Cancel</Button>
                          </div>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'COMPLETED' })}>Complete</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages}>Next</Button>
        </div>
      )}
    </div>
  )
}
