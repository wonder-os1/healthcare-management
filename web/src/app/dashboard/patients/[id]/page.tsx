'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Droplets, MapPin, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatTime, formatCurrency, getInitials, getStatusColor } from '@/lib/utils'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${id}`)
      return data.data
    },
  })

  const { data: history } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${id}/history`)
      return data.data
    },
    enabled: !!patient,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-muted-foreground">Loading patient...</div></div>
  }

  if (!patient) {
    return <div className="py-20 text-center text-muted-foreground">Patient not found</div>
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-xl">{getInitials(patient.user?.name || 'P')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{patient.user?.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {patient.user?.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.user.email}</span>}
            {patient.user?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{patient.user.phone}</span>}
            {patient.bloodGroup && <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{patient.bloodGroup}</span>}
            {patient.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{patient.address}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {patient.gender && <Badge variant="outline">{patient.gender}</Badge>}
            {patient.dateOfBirth && <Badge variant="secondary">DOB: {formatDate(patient.dateOfBirth)}</Badge>}
          </div>
          {patient.allergies && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div><strong>Allergies:</strong> {patient.allergies}</div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <Card>
            <CardHeader><CardTitle>Appointment History</CardTitle></CardHeader>
            <CardContent>
              {!history?.appointments?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointments yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.appointments.map((apt: any) => (
                      <TableRow key={apt.id}>
                        <TableCell>{formatDate(apt.date)}</TableCell>
                        <TableCell>{formatTime(apt.startTime)}</TableCell>
                        <TableCell>{apt.doctor?.user?.name || '—'}</TableCell>
                        <TableCell>{apt.type}</TableCell>
                        <TableCell><Badge className={getStatusColor(apt.status)} variant="outline">{apt.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader><CardTitle>Prescriptions</CardTitle></CardHeader>
            <CardContent>
              {!history?.prescriptions?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No prescriptions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Medicines</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.prescriptions.map((rx: any) => (
                      <TableRow key={rx.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/prescriptions/${rx.id}`)}>
                        <TableCell>{formatDate(rx.createdAt)}</TableCell>
                        <TableCell>{rx.doctor?.user?.name || '—'}</TableCell>
                        <TableCell>{rx.diagnosis}</TableCell>
                        <TableCell>{rx.items?.length || 0} items</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader><CardTitle>Medical Records</CardTitle></CardHeader>
            <CardContent>
              {!history?.medicalRecords?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No records yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Doctor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.medicalRecords.map((rec: any) => (
                      <TableRow key={rec.id}>
                        <TableCell>{formatDate(rec.createdAt)}</TableCell>
                        <TableCell><Badge variant="outline">{rec.type}</Badge></TableCell>
                        <TableCell>{rec.title}</TableCell>
                        <TableCell>{rec.doctor?.user?.name || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              {!history?.invoices?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell>{formatDate(inv.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(inv.total)}</TableCell>
                        <TableCell><Badge className={getStatusColor(inv.status)} variant="outline">{inv.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
