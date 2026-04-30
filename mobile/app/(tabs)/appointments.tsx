import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'

const TABS = ['all', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-appointments', activeTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (activeTab !== 'all') params.set('status', activeTab)
      const { data } = await api.get(`/appointments?${params}`)
      return data
    },
  })

  const appointments = data?.data || []

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setPage(1) }}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                backgroundColor: activeTab === tab ? '#2563eb' : '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: activeTab === tab ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
                {tab === 'all' ? 'All' : tab.replace('_', ' ').toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading && !appointments.length ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>No appointments found</Text>
          </View>
        ) : (
          appointments.map((apt: any) => (
            <TouchableOpacity
              key={apt.id}
              onPress={() => router.push(`/appointment/${apt.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
                    {apt.patient?.user?.name || 'Patient'}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                    Dr. {apt.doctor?.user?.name}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(apt.status) + '20' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: getStatusColor(apt.status) }}>
                    {apt.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{formatDate(apt.date)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{formatTime(apt.startTime)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="medical-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{apt.type}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}
