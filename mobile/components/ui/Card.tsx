import { View, type ViewStyle, type ReactNode } from 'react-native'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
