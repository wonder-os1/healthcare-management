'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FlaskConical } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { isFeatureEnabled } from '@/lib/features'
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
import { formatDate, getStatusColor } from '@/lib/utils'

const TEST_TYPES = ['BLOOD', 'URINE', 'IMAGING', 'PATHOLOGY', 'MICROBIOLOGY', 'OTHER']

export default function LabTestsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ patientId: '', testName: '', testType: 'BLOOD', notes: '' })

  if (!isFeatureEnabled('labIntegration')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FlaskConical className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Lab Integration Not Enabled</h2>
        <p className="text-muted-foreground max-w-md">This feature is not enabled for your plan. Contact your administrator to enable lab integration.</p>
      </div>
    )
  }

  const { data, isLoading } = useQuery({
    queryKey: ['lab-tests', page],
    queryFn: async () => {
      const { data } = await api.get(`/lab-tests?page=${page}&limit=15`)
      return data
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-lab'],
    queryFn: async () => { const { data } = await api.get('/patients?limit=100'); return data.data },
    enabled: user?.role !== 'PATIENT',
  })

  const createMutation = useMutation({
    mutationFn: async () => { const { data } = await api.post('/lab-tests', form); return data },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] })
      setDialogOpen(false)
      setForm({ patientId: '', testName: '', testType: 'BLOOD', notes: '' })
      toast({ title: 'Lab test ordered' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, result }: { id: string; status: string; result?: string }) => {
      const { data } = await api.patch(`/lab-tests/${id}`, { status, result })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] })
      toast({ title: 'Test updated' })
    },
  })

  const tests = data?.data || []
  const pagination = data?.pagination
  const canCreate = user && ['ADMIN', 'DOCTOR'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lab Tests</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Order Test</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Order Lab Test</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{(patientsData || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.user?.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Name *</Label>
                  <Input value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} required placeholder="e.g. Complete Blood Count" />
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select value={form.testType} onValueChange={(v) => setForm({ ...form, testType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Ordering...' : 'Order Test'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : tests.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No lab tests found</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  {canCreate && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test: any) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-sm">{formatDate(test.createdAt)}</TableCell>
                    <TableCell className="text-sm">{test.patient?.user?.name}</TableCell>
                    <TableCell className="text-sm font-medium">{test.testName}</TableCell>
                    <TableCell><Badge variant="outline">{test.testType}</Badge></TableCell>
                    <TableCell><Badge className={getStatusColor(test.status)} variant="outline">{test.status.replace('_', ' ')}</Badge></TableCell>
                    {canCreate && (
                      <TableCell>
                        {test.status === 'ORDERED' && (
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: test.id, status: 'SAMPLE_COLLECTED' })}>Collect Sample</Button>
                        )}
                        {test.status === 'SAMPLE_COLLECTED' && (
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: test.id, status: 'PROCESSING' })}>Processing</Button>
                        )}
                        {test.status === 'PROCESSING' && (
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: test.id, status: 'COMPLETED', result: 'Results available' })}>Complete</Button>
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
