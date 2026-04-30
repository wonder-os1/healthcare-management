import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientsScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () =>
      fetch(`${API}/patients?search=${search}`, {
        headers: { Authorization: `Bearer ${/* token */ ''}` },
      }).then(r => r.json()),
  })

  return (
    <View style={s.container}>
      <Text style={s.title}>Patients</Text>
      <TextInput
        style={s.search}
        placeholder="Search by name or phone..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={patients as any[]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/patient/${item.id}`)}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.name?.[0] || '?'}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                {item.phone} {item.gender ? `· ${item.gender}` : ''}{' '}
                {item.age ? `· ${item.age}y` : ''}
              </Text>
              {item.bloodGroup && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.bloodGroup}</Text>
                </View>
              )}
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>
            {isLoading ? 'Loading...' : 'No patients found'}
          </Text>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 24, paddingBottom: 8 },
  search: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
  },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#DC2626' },
  chevron: { fontSize: 24, color: '#D1D5DB' },
  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 40 },
})
