import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ icon = 'folder-open-outline', title, description }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name={icon as any} size={28} color="#94a3b8" />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b', textAlign: 'center' }}>{title}</Text>
      {description ? (
        <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>{description}</Text>
      ) : null}
    </View>
  )
}
