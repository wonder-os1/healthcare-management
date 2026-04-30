import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth-store'
import { getInitials } from '@/lib/utils'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Avatar & Info */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{user ? getInitials(user.name) : 'U'}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 12 }}>{user?.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{user?.email}</Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#eff6ff', marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#2563eb', textTransform: 'capitalize' }}>
            {user?.role?.toLowerCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      {user?.phone && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <ProfileRow icon="call-outline" label="Phone" value={user.phone} />
        </View>
      )}

      {/* Patient Info */}
      {user?.patient && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Patient Details</Text>
          {user.patient.dateOfBirth && <ProfileRow icon="calendar-outline" label="Date of Birth" value={user.patient.dateOfBirth} />}
          {user.patient.gender && <ProfileRow icon="person-outline" label="Gender" value={user.patient.gender} />}
          {user.patient.bloodGroup && <ProfileRow icon="water-outline" label="Blood Group" value={user.patient.bloodGroup} />}
          {user.patient.address && <ProfileRow icon="location-outline" label="Address" value={user.patient.address} />}
          {user.patient.allergies && <ProfileRow icon="alert-circle-outline" label="Allergies" value={user.patient.allergies} />}
        </View>
      )}

      {/* Doctor Info */}
      {user?.doctor && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Doctor Details</Text>
          <ProfileRow icon="medkit-outline" label="Specialization" value={user.doctor.specialization} />
          <ProfileRow icon="school-outline" label="Qualifications" value={user.doctor.qualifications} />
        </View>
      )}

      {/* Actions */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
        <MenuButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings')} />
        <MenuButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
        <MenuButton icon="help-circle-outline" label="Help & Support" onPress={() => Alert.alert('Help & Support', 'For support, email support@wonderos.in')} />
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={{ marginLeft: 12, fontWeight: '500', color: '#ef4444' }}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 24 }}>
        Powered by Wonder OS
      </Text>
    </ScrollView>
  )
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
      <Ionicons name={icon as any} size={18} color="#94a3b8" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{label}</Text>
        <Text style={{ fontWeight: '500', color: '#0f172a', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  )
}

function MenuButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
      <Ionicons name={icon as any} size={20} color="#374151" />
      <Text style={{ flex: 1, marginLeft: 12, fontWeight: '500', color: '#374151' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  )
}
