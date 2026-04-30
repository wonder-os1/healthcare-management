import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Button, Card, Input, EmptyState } from '@/components/ui'
import type { Doctor } from '@/types'

const APPOINTMENT_TYPES = ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'CHECK_UP']
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]

export default function BookAppointmentScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Form state
  const [step, setStep] = useState(1) // 1: Doctor, 2: Date/Time, 3: Details
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [appointmentType, setAppointmentType] = useState('CONSULTATION')
  const [reason, setReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch available doctors
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', searchQuery],
    queryFn: async () => {
      const { data } = await api.get('/doctors', {
        params: { search: searchQuery, limit: 50 },
      })
      return data.data as Doctor[]
    },
  })

  // Fetch available slots for selected doctor and date
  const { data: availableSlots } = useQuery({
    queryKey: ['slots', selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor?.id || !selectedDate) return TIME_SLOTS
      try {
        const { data } = await api.get(`/appointments/available-slots`, {
          params: { doctorId: selectedDoctor.id, date: selectedDate },
        })
        return (data.data as string[]) || TIME_SLOTS
      } catch {
        return TIME_SLOTS
      }
    },
    enabled: !!selectedDoctor?.id && !!selectedDate,
  })

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/appointments', {
        doctorId: selectedDoctor!.id,
        date: selectedDate,
        startTime: selectedTime,
        type: appointmentType,
        reason,
      })
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Appointment Booked', 'Your appointment has been scheduled successfully.', [
        { text: 'View', onPress: () => router.replace(`/appointment/${data.id}`) },
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Booking Failed', error.response?.data?.error || 'Could not book the appointment. Please try again.')
    },
  })

  // Generate next 14 days for date selection
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const slots = availableSlots || TIME_SLOTS

  return (
    <>
      <Stack.Screen options={{ title: 'Book Appointment', headerBackTitle: 'Back' }} />
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ padding: 20 }}>
          {/* Step Indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={{
                  width: s === step ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: s <= step ? '#2563eb' : '#e2e8f0',
                }}
              />
            ))}
          </View>

          {/* Step 1: Select Doctor */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Select a Doctor</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Choose your healthcare provider</Text>

              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={{ marginBottom: 16 }}
              />

              {loadingDoctors ? (
                <EmptyState icon="hourglass-outline" title="Loading doctors..." />
              ) : !doctorsData?.length ? (
                <EmptyState icon="people-outline" title="No doctors found" description="Try a different search term" />
              ) : (
                doctorsData.filter((d) => d.isAvailable).map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id}
                    onPress={() => { setSelectedDoctor(doctor); setStep(2) }}
                    style={{
                      backgroundColor: selectedDoctor?.id === doctor.id ? '#eff6ff' : '#fff',
                      borderWidth: selectedDoctor?.id === doctor.id ? 2 : 1,
                      borderColor: selectedDoctor?.id === doctor.id ? '#2563eb' : '#e2e8f0',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="person" size={24} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>Dr. {doctor.user?.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{doctor.specialization}</Text>
                      <Text style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>
                        Fee: {'\u20b9'}{(doctor.consultationFee / 100).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Select Date & Time</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                With Dr. {selectedDoctor?.user?.name}
              </Text>

              {/* Date Selection */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {dates.map((date) => (
                    <TouchableOpacity
                      key={date}
                      onPress={() => { setSelectedDate(date); setSelectedTime('') }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: selectedDate === date ? '#2563eb' : '#fff',
                        borderWidth: 1,
                        borderColor: selectedDate === date ? '#2563eb' : '#e2e8f0',
                        minWidth: 80,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDate === date ? '#fff' : '#374151' }}>
                        {formatDateLabel(date)}
                      </Text>
                      <Text style={{ fontSize: 11, color: selectedDate === date ? '#dbeafe' : '#94a3b8', marginTop: 2 }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Time Slots */}
              {selectedDate ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Available Slots</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSelectedTime(slot)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: selectedTime === slot ? '#2563eb' : '#fff',
                          borderWidth: 1,
                          borderColor: selectedTime === slot ? '#2563eb' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: selectedTime === slot ? '#fff' : '#374151' }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <Card style={{ alignItems: 'center' as const, padding: 24 }}>
                  <Ionicons name="calendar-outline" size={32} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', marginTop: 8 }}>Select a date to see available slots</Text>
                </Card>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button
                  title="Next"
                  onPress={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Appointment Details</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Review and confirm your booking</Text>

              {/* Summary */}
              <Card style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={20} color="#2563eb" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>Dr. {selectedDoctor?.user?.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>{selectedDoctor?.specialization}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Date</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatDateLabel(selectedDate)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Time</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{selectedTime}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Fee</Text>
                    <Text style={{ fontWeight: '500', color: '#22c55e' }}>
                      {'\u20b9'}{((selectedDoctor?.consultationFee || 0) / 100).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Type */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Appointment Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {APPOINTMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setAppointmentType(type)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: appointmentType === type ? '#2563eb' : '#fff',
                      borderWidth: 1,
                      borderColor: appointmentType === type ? '#2563eb' : '#e2e8f0',
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: appointmentType === type ? '#fff' : '#374151',
                      textTransform: 'capitalize',
                    }}>
                      {type.replace('_', ' ').toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reason */}
              <Input
                label="Reason for Visit"
                placeholder="Briefly describe your concern..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
                containerStyle={{ marginBottom: 24 }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 1 }} />
                <Button
                  title="Confirm Booking"
                  onPress={() => bookMutation.mutate()}
                  loading={bookMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  )
}
