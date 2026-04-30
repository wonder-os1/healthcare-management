'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pill, User, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: async () => {
      const { data } = await api.get(`/prescriptions/${id}`)
      return data.data
    },
  })

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-muted-foreground">Loading...</div></div>
  if (!rx) return <div className="py-20 text-center text-muted-foreground">Prescription not found</div>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prescription</CardTitle>
            <Badge variant="outline">{formatDate(rx.createdAt)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Patient</p>
              <p className="font-medium">{rx.patient?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{rx.patient?.user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Doctor</p>
              <p className="font-medium">Dr. {rx.doctor?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{rx.doctor?.specialization}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</p>
            <p className="font-medium">{rx.diagnosis}</p>
          </div>

          {rx.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{rx.notes}</p>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Pill className="h-4 w-4" />Medicines</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Instructions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rx.items || []).map((item: any, idx: number) => (
                  <TableRow key={item.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.medicineName || item.medicine?.name}</TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.instructions || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
