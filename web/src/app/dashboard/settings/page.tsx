'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

const SETTING_KEYS = [
  { key: 'businessName', label: 'Business Name', type: 'text' },
  { key: 'businessPhone', label: 'Phone Number', type: 'text' },
  { key: 'businessEmail', label: 'Email', type: 'email' },
  { key: 'businessAddress', label: 'Address', type: 'text' },
  { key: 'slotDuration', label: 'Appointment Slot Duration (minutes)', type: 'number' },
  { key: 'businessHoursStart', label: 'Business Hours Start', type: 'time' },
  { key: 'businessHoursEnd', label: 'Business Hours End', type: 'time' },
  { key: 'currency', label: 'Currency', type: 'text' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [values, setValues] = useState<Record<string, string>>({})

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      setValues(data.data || {})
      return data.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data } = await api.put('/settings', { key, value })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: 'Setting saved' })
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed' })
    },
  })

  if (user?.role !== 'ADMIN') {
    return <div className="py-20 text-center text-muted-foreground">Admin access required</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>Configure your clinic details and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          ) : (
            SETTING_KEYS.map((setting) => (
              <div key={setting.key} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label>{setting.label}</Label>
                  <Input
                    type={setting.type}
                    value={values[setting.key] || ''}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveMutation.mutate({ key: setting.key, value: values[setting.key] || '' })}
                  disabled={saveMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
