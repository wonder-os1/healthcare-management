'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileHeart } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

const RECORD_TYPES = ['DIAGNOSIS', 'LAB_RESULT', 'IMAGING', 'PROCEDURE', 'VACCINATION', 'ALLERGY', 'NOTE']

export default function MedicalRecordsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ patientId: '', type: 'DIAGNOSIS', title: '', description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', page],
    queryFn: async () => {
      const { data } = await api.get(`/medical-records?page=${page}&limit=15`)
      return data
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-mr'],
    queryFn: async () => { const { data } = await api.get('/patients?limit=100'); return data.data },
    enabled: user?.role !== 'PATIENT',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/medical-records', form)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
      setDialogOpen(false)
      setForm({ patientId: '', type: 'DIAGNOSIS', title: '', description: '' })
      toast({ title: 'Record created' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed' })
    },
  })

  const records = data?.data || []
  const pagination = data?.pagination
  const canCreate = user && ['ADMIN', 'DOCTOR'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Medical Records</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Record</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Medical Record</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{(patientsData || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.user?.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : records.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No records found</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Doctor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec: any) => (
                  <TableRow key={rec.id}>
                    <TableCell className="text-sm">{formatDate(rec.createdAt)}</TableCell>
                    <TableCell className="text-sm">{rec.patient?.user?.name}</TableCell>
                    <TableCell><Badge variant="outline">{rec.type.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{rec.title}</TableCell>
                    <TableCell className="text-sm">Dr. {rec.doctor?.user?.name}</TableCell>
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
