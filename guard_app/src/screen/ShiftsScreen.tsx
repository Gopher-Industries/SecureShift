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
      // optimistic: set pending
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Pending' } : r)));

      const res = await applyToShift(id); // { message, shift }
      const newStatus = (res?.shift?.status ?? '').toString().toLowerCase();

      // trust backend-mapped status ('pending' for guard)
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status:
                  newStatus === 'pending'
                    ? 'Pending'
                    : newStatus === 'confirmed'
                      ? 'Confirmed'
                      : newStatus === 'rejected'
                        ? 'Rejected'
                        : r.status,
              }
            : r,
        ),
      );

      Alert.alert('Applied', 'Your application has been sent.');
      // optional: background refresh later, not immediately
      // await fetchData();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? 'Failed to apply');
      // rollback on error
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: undefined } : r)));
    }
  };

  const renderItem = ({ item }: { item: ShiftDto }) => {
    const status = safeStatus(item.status);

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {err && !loading && <Text style={{ color: '#B00020', marginVertical: 8 }}>{err}</Text>}
      {!loading && !err && filtered.length === 0 && (
        <Text style={{ color: COLORS.muted, marginTop: 12 }}>No shifts found.</Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setSelectedShift(item);
              setDetailsVisible(true);
            }}
          >
            <Card
              title={item.title}
              company={item.company}
              site={item.site}
              rate={item.rate}
              onApply={canApply(item.status) ? () => onApply(item.id) : undefined}
            >
              <Text style={s.status}>
                <Text style={{ color: '#000' }}>Status: </Text>
                <Text style={{ color: colorFor(item.status) }}>{item.status ?? 'Available'}</Text>
              </Text>
              <View style={s.row}>
                <Text style={s.muted}>{formatDate(item.date)}</Text>
                <Text style={s.dot}> • </Text>
                <Text style={s.muted}>{item.time}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

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

      <ShiftDetailsModal
        visible={detailsVisible}
        shift={selectedShift}
        onClose={() => setDetailsVisible(false)}
      />
    </View>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <Text style={{ color: COLORS.link }}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </Text>
  );
}

/* --- Completed Tab --- */
function CompletedTab() {
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: null,
    company: [] as string[],
    site: [] as string[],
  });

  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);

      const resp = await myShifts('past');
      const completedMapped = mapCompleted(resp);
      setRows(completedMapped);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const filtered = filterShifts(rows, q, filters);

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted },

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {err && !loading && <Text style={{ color: '#B00020', marginVertical: 8 }}>{err}</Text>}
      {!loading && !err && filtered.length === 0 && (
        <Text style={{ color: COLORS.muted, marginTop: 12 }}>No completed shifts yet.</Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.muted}>{item.company}</Text>
                <Text style={s.muted}>{item.site}</Text>
              </View>
              <Text style={s.rate}>{item.rate}</Text>
            </View>
            <View style={s.rowSpace}>
              <Text style={s.status}>
                <Text style={{ color: '#000' }}>Status: </Text>
                <Text style={{ color: COLORS.link }}>
                  Completed {item.rated ? '(Rated)' : '(Unrated)'}
                </Text>
              </Text>
              <Stars n={item.rating} />
            </View>
            <View style={s.row}>
              <Text style={s.muted}>{formatDate(item.date)}</Text>
              <Text style={s.dot}> • </Text>
              <Text style={s.muted}>{item.time}</Text>
            </View>
          </View>
        )}
      />

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1, paddingRight: 10 },

export default function ShiftScreen() {
  return (
    <Top.Navigator
      screenOptions={({ route }) => ({
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarStyle: {
          backgroundColor: '#E7E7EB',
          borderRadius: 12,
          marginHorizontal: 12,
          marginTop: 8,
          overflow: 'hidden', // keeps indicator rounded
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#274289', // blue background
          height: '100%', // fill the tab height
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          textTransform: 'none',
        },
        tabBarActiveTintColor: '#fff', // white text when active
        tabBarInactiveTintColor: '#000', // black text when inactive
      })}
    >
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}

/* Styles */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 8 },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtn: {
    marginLeft: 8,
    width: 40,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 18,
    color: COLORS.text,
  },
  applyBtnText: { color: '#fff', fontWeight: '800' },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  muted: { color: COLORS.muted },
  rate: { fontSize: 15, fontWeight: '800', color: COLORS.rate },

  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: { color: COLORS.muted },

  status: { marginTop: 6, color: COLORS.muted },

  // Filter Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalLabel: { marginTop: 10, fontWeight: '600' },
  tag: { padding: 8, marginRight: 6, backgroundColor: '#eee', borderRadius: 20 },
  tagSelected: { backgroundColor: COLORS.primary },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: 'bold' },

  // Apply
  applyBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700' },
});
