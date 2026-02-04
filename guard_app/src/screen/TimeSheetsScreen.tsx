// src/screen/TimesheetsScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getMyAttendance, type Attendance } from '../api/attendance';
import { COLORS } from '../theme/colors';

function safeDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtDateTime(d?: string | null) {
  const dt = safeDate(d);
  if (!dt) return '—';
  return dt.toLocaleString();
}

function fmtShiftLabel(att: Attendance) {
  // If backend populates shiftId, it may contain title/date/startTime
  const s = att.shiftId as any;

  if (s && typeof s === 'object') {
    const title = s.title ?? 'Shift';
    const date = s.date ? new Date(s.date).toDateString() : '';
    const time = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : '';
    const parts = [title, date, time].filter(Boolean);
    return parts.join(' • ');
  }

  // otherwise shiftId is string
  return `Shift ID: ${String(att.shiftId)}`;
}

export default function TimesheetsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Attendance[]>([]);

  const load = async () => {
    try {
      const rows = await getMyAttendance();
      setItems(rows);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load timesheets';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const renderItem = ({ item }: { item: Attendance }) => {
    const checkedIn = !!item.checkInTime;
    const checkedOut = !!item.checkOutTime;

    return (
      <View style={s.card}>
        <Text style={s.title}>{fmtShiftLabel(item)}</Text>

        <View style={s.row}>
          <Text style={s.label}>Check In:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkInTime ?? null)}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Check Out:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkOutTime ?? null)}</Text>
        </View>

        <View style={s.rowBetween}>
          <Text style={s.meta}>
            Status:{' '}
            <Text style={checkedIn ? s.ok : s.muted}>
              {checkedOut ? 'Completed' : checkedIn ? 'In progress' : 'Not started'}
            </Text>
          </Text>

          <View style={[s.badge, item.locationVerified ? s.badgeOk : s.badgeWarn]}>
            <Text style={[s.badgeText, item.locationVerified ? s.badgeTextOk : s.badgeTextWarn]}>
              {item.locationVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Loading timesheets...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>No timesheet records yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted },

  empty: { textAlign: 'center', marginTop: 30, color: COLORS.muted },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },

  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 85, fontWeight: '700', color: COLORS.text },
  value: { flex: 1, color: COLORS.muted },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  meta: { marginTop: 8, color: COLORS.text, fontWeight: '700' },
  ok: { color: COLORS.status.confirmed, fontWeight: '800' },
  muted: { color: COLORS.muted, fontWeight: '800' },

  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeOk: { backgroundColor: '#D1FAE5' },
  badgeWarn: { backgroundColor: '#FEF3C7' },

  badgeText: { fontWeight: '800', fontSize: 12 },
  badgeTextOk: { color: '#065F46' },
  badgeTextWarn: { color: '#92400E' },
});
