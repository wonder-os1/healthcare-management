import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
  primary: { bg: '#2563eb', text: '#ffffff' },
  secondary: { bg: '#f1f5f9', text: '#334155' },
  outline: { bg: 'transparent', text: '#2563eb', border: '#2563eb' },
  ghost: { bg: 'transparent', text: '#475569' },
  danger: { bg: '#ef4444', text: '#ffffff' },
}

const sizeStyles: Record<string, { px: number; py: number; fontSize: number }> = {
  sm: { px: 12, py: 8, fontSize: 13 },
  md: { px: 20, py: 12, fontSize: 15 },
  lg: { px: 24, py: 16, fontSize: 16 },
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, style }: ButtonProps) {
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: 10,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          flexDirection: 'row' as const,
          opacity: disabled ? 0.5 : 1,
          ...(v.border ? { borderWidth: 1, borderColor: v.border } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  )
}
