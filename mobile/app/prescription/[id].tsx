import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: async () => {
      const { data } = await api.get(`/prescriptions/${id}`)
      return data.data
    },
  })

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563eb" /></View>
  if (!rx) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(rx.createdAt)}</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>{rx.diagnosis}</Text>
        {rx.notes && <Text style={{ color: '#64748b', marginTop: 8 }}>{rx.notes}</Text>}
      </View>

      {/* Doctor & Patient */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="person-outline" size={14} color="#2563eb" />
            <Text style={{ fontSize: 12, color: '#64748b' }}>Patient</Text>
          </View>
          <Text style={{ fontWeight: '500' }}>{rx.patient?.user?.name}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="medical-outline" size={14} color="#2563eb" />
            <Text style={{ fontSize: 12, color: '#64748b' }}>Doctor</Text>
          </View>
          <Text style={{ fontWeight: '500' }}>Dr. {rx.doctor?.user?.name}</Text>
        </View>
      </View>

      {/* Medicines */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Ionicons name="medkit-outline" size={18} color="#2563eb" />
          <Text style={{ fontWeight: '600', fontSize: 16 }}>Medicines</Text>
        </View>

        {(rx.items || []).map((item: any, idx: number) => (
          <View key={item.id || idx} style={{ paddingVertical: 12, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }}>
            <Text style={{ fontWeight: '600', color: '#0f172a' }}>{idx + 1}. {item.medicineName || item.medicine?.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
              {item.dosage && <Tag label="Dosage" value={item.dosage} />}
              {item.frequency && <Tag label="Frequency" value={item.frequency} />}
              {item.duration && <Tag label="Duration" value={item.duration} />}
            </View>
            {item.instructions && <Text style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{item.instructions}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, color: '#64748b' }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>{value}</Text>
    </View>
  )
}
