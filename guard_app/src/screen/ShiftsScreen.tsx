import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

import { applyToShift, listShifts } from '../api/shifts';
import { COLORS } from '../theme/colors';

import type { ShiftDto } from '../api/shifts';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ShiftDetails: { shift: ShiftDto; refresh?: () => void };
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function safeStatus(s?: string) {
  return (s ?? 'open').toLowerCase();
}

function formatDatePretty(dateStr?: string) {
  if (!dateStr) return 'Date N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatTimeRange(start?: string, end?: string) {
  if (!start && !end) return '';
  if (start && end) return `${start} - ${end}`;
  return start ?? end ?? '';
}

export default function ShiftsScreen() {
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ShiftDto[]>([]);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await listShifts(1, 50);
      setItems(res.items ?? []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? 'Failed to load shifts. Check backend + token.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useFocusEffect(
    useCallback(() => {
      fetchShifts();
    }, [fetchShifts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShifts();
  };

  const onApply = async (shiftId: string) => {
    try {
      const res = await applyToShift(shiftId);
      Alert.alert('Applied', res?.message ?? 'Applied successfully ✅');
      await fetchShifts();
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const backendMsg = e?.response?.data?.message;
      const msg = backendMsg ?? e?.message ?? 'Failed to apply';

      if (statusCode === 403) {
        Alert.alert(
          'Forbidden',
          'Forbidden: insufficient permissions.\n\nYou might be logged in with a non-guard role. Log out, clear app storage, and login as a guard.',
        );
        return;
      }

      Alert.alert('Error', msg);
    }
  };

  const renderItem = ({ item }: { item: ShiftDto }) => {
    const status = safeStatus(item.status);

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('ShiftDetails', {
            shift: item,
            refresh: fetchShifts,
          })
        }
      >
        <View style={s.rowBetween}>
          <Text style={s.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.badge, status === 'open' ? s.badgeOpen : s.badgeOther]}>
            {status.toUpperCase()}
          </Text>
        </View>

        <Text style={s.subText}>{item.createdBy?.company ?? 'Company N/A'}</Text>

        <Text style={s.subText}>
          {formatDatePretty(item.date)}
          {formatTimeRange(item.startTime, item.endTime)
            ? ` • ${formatTimeRange(item.startTime, item.endTime)}`
            : ''}
        </Text>

        <View style={s.rowBetween}>
          <Text style={s.pay}>${item.payRate ?? 0}/hr</Text>

          {status === 'open' ? (
            <TouchableOpacity style={s.applyBtn} onPress={() => onApply(item._id)}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.dimText}>
              {status === 'applied'
                ? 'Applied'
                : status === 'assigned'
                  ? 'Assigned'
                  : status === 'completed'
                    ? 'Completed'
                    : status}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Loading shifts...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>No shifts found.</Text>}
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

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1, paddingRight: 10 },

  badge: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeOpen: { backgroundColor: '#E8F0FF', color: COLORS.primary },
  badgeOther: { backgroundColor: '#F2F2F2', color: '#444' },

  subText: { color: COLORS.muted, marginTop: 6 },

  pay: { fontWeight: '800', color: COLORS.text, marginTop: 12 },

  applyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  applyBtnText: { color: '#fff', fontWeight: '800' },

  dimText: { marginTop: 12, color: COLORS.muted, fontWeight: '700' },
});
