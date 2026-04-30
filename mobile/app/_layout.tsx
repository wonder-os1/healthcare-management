import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

export default function RootLayout() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="appointment/[id]" options={{ headerShown: true, title: 'Appointment Details' }} />
        <Stack.Screen name="prescription/[id]" options={{ headerShown: true, title: 'Prescription Details' }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: true, title: 'Doctor Profile' }} />
        <Stack.Screen name="book-appointment/index" options={{ headerShown: true, title: 'Book Appointment' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'Settings' }} />
      </Stack>
    </QueryClientProvider>
  )
}
