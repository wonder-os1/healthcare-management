import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatDate } from '@/lib/utils'
import type { Prescription } from '@/types'

interface PrescriptionCardProps {
  prescription: Prescription
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      onPress={() => router.push(`/prescription/${prescription.id}`)}
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
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name="document-text-outline" size={20} color="#22c55e" />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
          {prescription.diagnosis}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          {prescription.doctor?.user?.name ? `Dr. ${prescription.doctor.user.name}` : 'Doctor'}
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
          {formatDate(prescription.createdAt)} · {prescription.items?.length || 0} medicine{(prescription.items?.length || 0) !== 1 ? 's' : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  )
}
