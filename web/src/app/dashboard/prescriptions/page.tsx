'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface MedItem {
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export default function PrescriptionsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ patientId: '', diagnosis: '', notes: '' })
  const [items, setItems] = useState<MedItem[]>([{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const [medSearch, setMedSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page],
    queryFn: async () => {
      const { data } = await api.get(`/prescriptions?page=${page}&limit=15`)
      return data
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-rx'],
    queryFn: async () => { const { data } = await api.get('/patients?limit=100'); return data.data },
    enabled: user?.role !== 'PATIENT',
  })

  const { data: medResults } = useQuery({
    queryKey: ['medicine-search', medSearch],
    queryFn: async () => { const { data } = await api.get(`/prescriptions/medicines/search?q=${medSearch}`); return data.data },
    enabled: medSearch.length >= 2,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/prescriptions', { ...form, items: items.filter((i) => i.medicineName) })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      setDialogOpen(false)
      setForm({ patientId: '', diagnosis: '', notes: '' })
      setItems([{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])
      toast({ title: 'Prescription created' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to create' })
    },
  })

  const addItem = () => setItems([...items, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  const updateItem = (index: number, field: keyof MedItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const prescriptions = data?.data || []
  const pagination = data?.pagination
  const canCreate = user && ['ADMIN', 'DOCTOR'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Prescription</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Prescription</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>{(patientsData || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.user?.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis *</Label>
                    <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Medicines</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>Add Medicine</Button>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Medicine {idx + 1}</span>
                        {items.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive h-6" onClick={() => removeItem(idx)}>Remove</Button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Medicine name *" value={item.medicineName} onChange={(e) => { updateItem(idx, 'medicineName', e.target.value); setMedSearch(e.target.value) }} />
                        <Input placeholder="Dosage (e.g. 500mg)" value={item.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} />
                        <Input placeholder="Frequency (e.g. Twice daily)" value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} />
                        <Input placeholder="Duration (e.g. 7 days)" value={item.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} />
                      </div>
                      <Input placeholder="Special instructions" value={item.instructions} onChange={(e) => updateItem(idx, 'instructions', e.target.value)} />
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Prescription'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : prescriptions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No prescriptions found</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((rx: any) => (
                  <TableRow key={rx.id}>
                    <TableCell className="text-sm">{formatDate(rx.createdAt)}</TableCell>
                    <TableCell className="text-sm">{rx.patient?.user?.name}</TableCell>
                    <TableCell className="text-sm">Dr. {rx.doctor?.user?.name}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{rx.diagnosis}</TableCell>
                    <TableCell><Badge variant="secondary">{rx.items?.length || 0} items</Badge></TableCell>
                    <TableCell>
                      <Link href={`/dashboard/prescriptions/${rx.id}`}>
                        <Button variant="ghost" size="sm"><FileText className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
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
