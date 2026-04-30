import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const TABS = [
  { key: 'prescriptions', label: 'Prescriptions', icon: 'document-text-outline' },
  { key: 'records', label: 'Medical Records', icon: 'folder-outline' },
]

export default function RecordsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('prescriptions')

  const { data: prescriptions, isLoading: rxLoading, refetch: refetchRx } = useQuery({
    queryKey: ['mobile-prescriptions'],
    queryFn: async () => {
      const { data } = await api.get('/prescriptions?limit=20')
      return data.data
    },
    enabled: activeTab === 'prescriptions',
  })

  const { data: medRecords, isLoading: mrLoading, refetch: refetchMr } = useQuery({
    queryKey: ['mobile-medical-records'],
    queryFn: async () => {
      const { data } = await api.get('/medical-records?limit=20')
      return data.data
    },
    enabled: activeTab === 'records',
  })

  const isLoading = activeTab === 'prescriptions' ? rxLoading : mrLoading
  const refetch = activeTab === 'prescriptions' ? refetchRx : refetchMr

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1, paddingVertical: 14, alignItems: 'center',
              borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? '#2563eb' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: activeTab === tab.key ? '#2563eb' : '#64748b' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : activeTab === 'prescriptions' ? (
          !prescriptions?.length ? (
            <EmptyState icon="document-text-outline" text="No prescriptions yet" />
          ) : (
            prescriptions.map((rx: any) => (
              <TouchableOpacity
                key={rx.id}
                onPress={() => router.push(`/prescription/${rx.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a' }}>{rx.diagnosis}</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(rx.createdAt)}</Text>
                </View>
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                  Dr. {rx.doctor?.user?.name} — {rx.items?.length || 0} medicines
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          !medRecords?.length ? (
            <EmptyState icon="folder-outline" text="No medical records yet" />
          ) : (
            medRecords.map((rec: any) => (
              <View key={rec.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>{rec.type.replace('_', ' ')}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(rec.createdAt)}</Text>
                </View>
                <Text style={{ fontWeight: '600', color: '#0f172a', marginTop: 8 }}>{rec.title}</Text>
                {rec.description && <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{rec.description}</Text>}
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>Dr. {rec.doctor?.user?.name}</Text>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 60 }}>
      <Ionicons name={icon as any} size={48} color="#cbd5e1" />
      <Text style={{ color: '#94a3b8', marginTop: 12 }}>{text}</Text>
    </View>
  )
}
