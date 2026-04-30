import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/${id}`)
      return data.data
    },
  })

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563eb" /></View>
  if (!doctor) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="person" size={36} color="#2563eb" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 12 }}>
          Dr. {doctor.user?.name}
        </Text>
        <Text style={{ color: '#2563eb', fontWeight: '500', marginTop: 4 }}>{doctor.specialization}</Text>
        {doctor.department && <Text style={{ color: '#64748b', marginTop: 2 }}>{doctor.department.name}</Text>}
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <InfoRow icon="cash-outline" label="Consultation Fee" value={formatCurrency(doctor.consultationFee)} />
        <InfoRow icon="school-outline" label="Qualifications" value={doctor.qualifications} />
        {doctor.licenseNumber && <InfoRow icon="id-card-outline" label="License" value={doctor.licenseNumber} />}
        <InfoRow icon="checkmark-circle-outline" label="Status" value={doctor.isAvailable ? 'Available' : 'Unavailable'} />
      </View>

      {doctor.user?.email && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <InfoRow icon="mail-outline" label="Email" value={doctor.user.email} />
          {doctor.user?.phone && <InfoRow icon="call-outline" label="Phone" value={doctor.user.phone} />}
        </View>
      )}
    </ScrollView>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Ionicons name={icon as any} size={18} color="#94a3b8" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{label}</Text>
        <Text style={{ fontWeight: '500', color: '#0f172a', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  )
}
