import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'
import type { Appointment } from '@/types'

interface AppointmentCardProps {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter()
  const statusColor = getStatusColor(appointment.status)

  return (
    <TouchableOpacity
      onPress={() => router.push(`/appointment/${appointment.id}`)}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name="calendar-outline" size={20} color="#2563eb" />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
          {appointment.doctor?.user?.name ? `Dr. ${appointment.doctor.user.name}` : appointment.patient?.user?.name || 'Appointment'}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
        </Text>
        {appointment.type && (
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
            {appointment.type.replace(/_/g, ' ')}
          </Text>
        )}
      </View>

      <View style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: statusColor + '20',
      }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
          {appointment.status.replace(/_/g, ' ')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
