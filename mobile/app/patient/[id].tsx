import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams()

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () =>
      fetch(`${API}/patients/${id}`, {
        headers: { Authorization: `Bearer ${/* token */ ''}` },
      }).then(r => r.json()),
  })

  const { data: history = [] } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: () =>
      fetch(`${API}/patients/${id}/history`, {
        headers: { Authorization: `Bearer ${/* token */ ''}` },
      })
        .then(r => r.json())
        .catch(() => []),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    )
  }

  const p = patient as any

  if (!p) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingText}>Patient not found</Text>
      </View>
    )
  }

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{p.name?.[0] || '?'}</Text>
        </View>
        <Text style={s.name}>{p.name}</Text>
        <Text style={s.meta}>
          {p.age ? `${p.age}y` : ''} {p.gender ? `· ${p.gender}` : ''}{' '}
          {p.bloodGroup ? `· ${p.bloodGroup}` : ''}
        </Text>
        <Text style={s.phone}>{p.phone}</Text>
      </View>

      {/* Info Cards */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Contact Information</Text>
        <View style={s.card}>
          <InfoRow label="Phone" value={p.phone || '—'} />
          <InfoRow label="Email" value={p.email || '—'} />
          <InfoRow label="Date of Birth" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'} />
          <InfoRow label="Address" value={p.address || '—'} />
        </View>
      </View>

      {/* Allergies */}
      {p.allergies && p.allergies.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Allergies</Text>
          <View style={s.allergyContainer}>
            {(Array.isArray(p.allergies) ? p.allergies : [p.allergies]).map((a: string, i: number) => (
              <View key={i} style={s.allergyBadge}>
                <Text style={s.allergyText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Visit History */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Visit History</Text>
        {(history as any[]).length === 0 ? (
          <Text style={s.empty}>No visit history</Text>
        ) : (
          (history as any[]).map((visit: any, i: number) => (
            <View key={visit.id || i} style={s.visitCard}>
              <View style={s.visitHeader}>
                <Text style={s.visitDate}>
                  {new Date(visit.date || visit.createdAt).toLocaleDateString()}
                </Text>
                <Text style={s.visitDoctor}>Dr. {visit.doctor?.user?.name || visit.doctor?.name || '—'}</Text>
              </View>
              {visit.diagnosis && (
                <Text style={s.visitDiagnosis}>Diagnosis: {visit.diagnosis}</Text>
              )}
              {visit.chiefComplaint && (
                <Text style={s.visitMeta}>Complaint: {visit.chiefComplaint}</Text>
              )}
              {visit.vitals && (
                <View style={s.vitalsRow}>
                  {visit.vitals.bp && <Text style={s.vital}>BP: {visit.vitals.bp}</Text>}
                  {visit.vitals.pulse && <Text style={s.vital}>Pulse: {visit.vitals.pulse}</Text>}
                  {visit.vitals.temp && <Text style={s.vital}>Temp: {visit.vitals.temp}</Text>}
                  {visit.vitals.weight && <Text style={s.vital}>Wt: {visit.vitals.weight}kg</Text>}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9CA3AF', fontSize: 16 },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#2563EB' },
  name: { fontSize: 22, fontWeight: 'bold' },
  meta: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  phone: { fontSize: 14, color: '#2563EB', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { color: '#6B7280', fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  allergyContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergyBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  allergyText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  visitCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  visitDate: { fontWeight: '600', fontSize: 14 },
  visitDoctor: { color: '#2563EB', fontSize: 13 },
  visitDiagnosis: { fontSize: 14, marginTop: 4 },
  visitMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  vitalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  vital: { fontSize: 12, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20 },
})
