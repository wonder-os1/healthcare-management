import { View, Text, ScrollView, Switch, TouchableOpacity, Alert, Linking } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true)
  const [smsReminders, setSmsReminders] = useState(false)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Notification Preferences */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
        Notifications
      </Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 20 }}>
        <SettingToggle
          icon="notifications-outline"
          label="Push Notifications"
          description="Appointment reminders and updates"
          value={notifications}
          onToggle={setNotifications}
        />
        <SettingToggle
          icon="chatbubble-outline"
          label="SMS Reminders"
          description="Text message reminders before appointments"
          value={smsReminders}
          onToggle={setSmsReminders}
          border={false}
        />
      </View>

      {/* About */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
        About
      </Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 20 }}>
        <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
        <SettingButton
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available at launch.')}
        />
        <SettingButton
          icon="shield-outline"
          label="Terms of Service"
          onPress={() => Alert.alert('Terms of Service', 'Terms of service will be available at launch.')}
          border={false}
        />
      </View>

      {/* Support */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
        Support
      </Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 12 }}>
        <SettingButton
          icon="mail-outline"
          label="Contact Support"
          onPress={() => Linking.openURL('mailto:support@wonderos.in')}
        />
        <SettingButton
          icon="help-circle-outline"
          label="Help Center"
          onPress={() => Alert.alert('Help Center', 'Help center is coming soon.')}
          border={false}
        />
      </View>
    </ScrollView>
  )
}

function SettingToggle({ icon, label, description, value, onToggle, border = true }: {
  icon: string; label: string; description: string; value: boolean; onToggle: (v: boolean) => void; border?: boolean
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: border ? 1 : 0, borderBottomColor: '#f1f5f9' }}>
      <Ionicons name={icon as any} size={20} color="#374151" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '500', color: '#0f172a' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: '#2563eb', false: '#e2e8f0' }} />
    </View>
  )
}

function SettingRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
      <Ionicons name={icon as any} size={20} color="#374151" />
      <Text style={{ flex: 1, marginLeft: 12, fontWeight: '500', color: '#0f172a' }}>{label}</Text>
      <Text style={{ color: '#94a3b8' }}>{value}</Text>
    </View>
  )
}

function SettingButton({ icon, label, onPress, border = true }: { icon: string; label: string; onPress: () => void; border?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: border ? 1 : 0, borderBottomColor: '#f1f5f9' }}>
      <Ionicons name={icon as any} size={20} color="#374151" />
      <Text style={{ flex: 1, marginLeft: 12, fontWeight: '500', color: '#0f172a' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  )
}
