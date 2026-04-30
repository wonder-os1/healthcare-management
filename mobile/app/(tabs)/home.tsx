import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate, formatTime, formatCurrency, getStatusColor } from '@/lib/utils'
import type { DashboardStats } from '@/types'

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['mobile-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data.data
    },
  })

  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Hello, {firstName}</Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>
          {user?.role?.toLowerCase().replace('_', ' ')}
        </Text>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          <StatCard
            title="Today's Appts"
            value={String(stats?.todayAppointments || 0)}
            icon="calendar"
            color="#3b82f6"
            bg="#eff6ff"
          />
          <StatCard
            title="Completed"
            value={String(stats?.todayCompleted || 0)}
            icon="checkmark-circle"
            color="#22c55e"
            bg="#f0fdf4"
          />
          <StatCard
            title="Patients"
            value={String(stats?.totalPatients || 0)}
            icon="people"
            color="#8b5cf6"
            bg="#f5f3ff"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats?.monthlyRevenue || 0)}
            icon="cash"
            color="#f59e0b"
            bg="#fffbeb"
          />
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 24, marginBottom: 12 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <QuickAction title="Book" icon="add-circle" onPress={() => router.push('/book-appointment')} />
          <QuickAction title="Appointments" icon="calendar" onPress={() => router.push('/(tabs)/appointments')} />
          <QuickAction title="Records" icon="document-text" onPress={() => router.push('/(tabs)/records')} />
        </View>

        {/* Recent Appointments */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 24, marginBottom: 12 }}>Recent Appointments</Text>
        {!stats?.recentAppointments?.length ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8' }}>No recent appointments</Text>
          </View>
        ) : (
          stats.recentAppointments.slice(0, 5).map((apt) => (
            <TouchableOpacity
              key={apt.id}
              onPress={() => router.push(`/appointment/${apt.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '500', color: '#0f172a' }}>{apt.patient?.user?.name || 'Patient'}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  {formatDate(apt.date)} at {formatTime(apt.startTime)}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(apt.status) + '20' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: getStatusColor(apt.status) }}>
                  {apt.status.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

function StatCard({ title, value, icon, color, bg }: { title: string; value: string; icon: string; color: string; bg: string }) {
  return (
    <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{title}</Text>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>{value}</Text>
    </View>
  )
}

function QuickAction({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon as any} size={20} color="#2563eb" />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginTop: 8 }}>{title}</Text>
    </TouchableOpacity>
  )
}
