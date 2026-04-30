import { View, Text } from 'react-native'
import { getStatusColor } from '@/lib/utils'

interface BadgeProps {
  label: string
  status?: string
  color?: string
  backgroundColor?: string
}

export function Badge({ label, status, color, backgroundColor }: BadgeProps) {
  const statusColor = status ? getStatusColor(status) : color || '#6b7280'
  const bg = backgroundColor || statusColor + '20'

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor, textTransform: 'uppercase' }}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}
