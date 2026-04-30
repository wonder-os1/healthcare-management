import { View, Text, TextInput, type TextInputProps, type ViewStyle } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[
          {
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: error ? '#ef4444' : '#e2e8f0',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            color: '#0f172a',
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  )
}
