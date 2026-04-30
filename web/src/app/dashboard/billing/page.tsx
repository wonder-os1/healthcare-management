'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, IndianRupee } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'

interface LineItem { description: string; quantity: number; unitPrice: number }

export default function BillingPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  const [form, setForm] = useState({ patientId: '', discount: 0 })
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [payMethod, setPayMethod] = useState('CASH')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await api.get(`/billing/invoices?${params}`)
      return data
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-bill'],
    queryFn: async () => { const { data } = await api.get('/patients?limit=100'); return data.data },
    enabled: user?.role !== 'PATIENT',
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const items = lineItems.filter((i) => i.description).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: Math.round(i.unitPrice * 100),
      }))
      const { data } = await api.post('/billing/invoices', {
        patientId: form.patientId,
        items,
        discount: Math.round(form.discount * 100),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setDialogOpen(false)
      setForm({ patientId: '', discount: 0 })
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }])
      toast({ title: 'Invoice created' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed' })
    },
  })

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/billing/payments', {
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.total,
        method: payMethod,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPayDialogOpen(false)
      setSelectedInvoice(null)
      toast({ title: 'Payment recorded' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed' })
    },
  })

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])
  const updateLineItem = (idx: number, field: keyof LineItem, val: string | number) => {
    const updated = [...lineItems]; updated[idx] = { ...updated[idx], [field]: val }; setLineItems(updated)
  }

  const invoices = data?.data || []
  const pagination = data?.pagination
  const canCreate = user && ['ADMIN', 'STAFF'].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Invoice</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createInvoiceMutation.mutate() }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{(patientsData || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.user?.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount (INR)</Label>
                    <Input type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>Add Item</Button>
                  </div>
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6"><Input placeholder="Description *" value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} /></div>
                      <div className="col-span-2"><Input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))} /></div>
                      <div className="col-span-3"><Input type="number" min={0} placeholder="Price (INR)" value={item.unitPrice || ''} onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))} /></div>
                      <div className="col-span-1">{lineItems.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>X</Button>}</div>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createInvoiceMutation.isPending}>
                    {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
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
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
          <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No invoices found</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  {canCreate && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm">{formatDate(inv.createdAt)}</TableCell>
                    <TableCell className="text-sm">{inv.patient?.user?.name}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(inv.subtotal)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(inv.tax)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(inv.discount)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.total)}</TableCell>
                    <TableCell><Badge className={getStatusColor(inv.status)} variant="outline">{inv.status}</Badge></TableCell>
                    {canCreate && (
                      <TableCell>
                        {inv.status === 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(inv); setPayDialogOpen(true) }}>
                            <IndianRupee className="mr-1 h-3 w-3" />Pay
                          </Button>
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

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <p className="text-sm">Amount: <strong>{formatCurrency(selectedInvoice.total)}</strong></p>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="RAZORPAY">Razorpay (Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={() => payMutation.mutate()} disabled={payMutation.isPending}>
                  {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
