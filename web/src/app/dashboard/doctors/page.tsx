'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Clock, IndianRupee } from 'lucide-react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCurrency, getInitials } from '@/lib/utils'

export default function DoctorsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (search) params.set('search', search)
      const { data } = await api.get(`/doctors?${params}`)
      return data
    },
  })

  const doctors = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Doctors</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or specialization..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : doctors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No doctors found</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback>{getInitials(doc.user?.name || 'D')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">Dr. {doc.user?.name}</p>
                      <p className="text-sm text-primary">{doc.specialization}</p>
                      {doc.department && <p className="text-xs text-muted-foreground">{doc.department.name}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />{formatCurrency(doc.consultationFee)}
                        </span>
                        <Badge variant={doc.isAvailable ? 'default' : 'secondary'} className="text-xs">
                          {doc.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      {doc.qualifications && (
                        <p className="mt-2 text-xs text-muted-foreground truncate">{doc.qualifications}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
