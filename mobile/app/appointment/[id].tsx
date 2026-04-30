import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${id}`)
      return data.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/appointments/${id}`, { status: 'CANCELLED' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Cancelled', 'Appointment has been cancelled.')
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel appointment.')
    },
  })

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    )
  }

  const handleReschedule = () => {
    router.push(`/book-appointment?rescheduleId=${id}&doctorId=${apt?.doctorId}`)
  }

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563eb" /></View>
  if (!apt) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  const canCancel = ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
  const canReschedule = ['SCHEDULED', 'CONFIRMED'].includes(apt.status)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Status Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: getStatusColor(apt.status) + '20' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: getStatusColor(apt.status) }}>
            {apt.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Patient Info */}
      <InfoCard title="Patient" icon="person-outline">
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{apt.patient?.user?.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{apt.patient?.user?.email}</Text>
        {apt.patient?.user?.phone && <Text style={{ color: '#64748b' }}>{apt.patient.user.phone}</Text>}
      </InfoCard>

      {/* Doctor Info */}
      <InfoCard title="Doctor" icon="medical-outline">
        <Text style={{ fontWeight: '600', fontSize: 16 }}>Dr. {apt.doctor?.user?.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{apt.doctor?.specialization}</Text>
      </InfoCard>

      {/* Appointment Details */}
      <InfoCard title="Details" icon="information-circle-outline">
        <DetailRow label="Date" value={formatDate(apt.date)} />
        <DetailRow label="Time" value={`${formatTime(apt.startTime)} — ${formatTime(apt.endTime)}`} />
        <DetailRow label="Type" value={apt.type} />
        {apt.reason && <DetailRow label="Reason" value={apt.reason} />}
        {apt.notes && <DetailRow label="Notes" value={apt.notes} />}
      </InfoCard>

      {/* Actions */}
      {(canCancel || canReschedule) && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {canReschedule && (
            <TouchableOpacity
              onPress={handleReschedule}
              style={{ flex: 1, backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Reschedule</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca' }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Ionicons name={icon as any} size={18} color="#2563eb" />
        <Text style={{ fontWeight: '600', color: '#374151' }}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
      <Text style={{ fontWeight: '500', color: '#0f172a', fontSize: 14, maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}
