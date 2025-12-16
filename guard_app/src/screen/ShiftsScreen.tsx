import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
// Auto refresh when navigating back

import { listShifts, myShifts, applyToShift, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';
// From Shifts API

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

type AppliedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  status?: 'Pending' | 'Confirmed' | 'Rejected';
};

type CompletedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  rated: boolean;
  rating: number;
};

/* To rate helper to backend */
const toRate = (r?: number | string) => (typeof r === 'number' ? `$${r} p/h` : (r ?? '$—'));

/* Show Apply only for shifts that have not been applied for */
const canApply = (st?: AppliedShift['status']) => !st; // only show if status is undefined/null

// Applied / My Shifts
function mapMineShifts(s: ShiftDto[] | unknown, myUid: string): AppliedShift[] {
  const arr = Array.isArray(s) ? s : [];
  return arr
    .filter((x) => x.status !== 'completed')
    .map((x) => {
      let status: AppliedShift['status'] | undefined;

      const acceptedId =
        typeof x.acceptedBy === 'object' ? x.acceptedBy?._id : String(x.acceptedBy ?? '');
      const applicants = Array.isArray(x.applicants)
        ? x.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      if (x.status === 'assigned' && acceptedId === myUid) {
        status = 'Confirmed';
      } else if (x.status === 'assigned' && applicants.includes(myUid)) {
        status = 'Rejected';
      } else if (x.status === 'applied') {
        status = 'Pending';
      }

      return {
        id: x._id,
        title: x.title,
        company: x.createdBy?.company ?? '—',
        site: x.location
          ? `${x.location.suburb ?? ''} ${x.location.state ?? ''}`.trim() || '—'
          : '—',
        rate: typeof x.payRate === 'number' ? `$${x.payRate} p/h` : (x.payRate ?? '$—'),
        date: x.date,
        time: `${x.startTime} - ${x.endTime}`,
        status,
      };
    });
}

// Global list = "Available"
function mapGlobalShifts(s: ShiftDto[] | unknown, myIds: Set<string>): AppliedShift[] {
  const arr = Array.isArray(s) ? s : [];
  return arr
    .filter((x) => ['open', 'applied'].includes((x.status ?? 'open').toLowerCase()))
    .filter((x) => !myIds.has(x._id))
    .map((x) => ({
      id: x._id,
      title: x.title,
      company: x.createdBy?.company ?? '—',
      site: x.location ? `${x.location.suburb ?? ''} ${x.location.state ?? ''}`.trim() || '—' : '—',
      rate: typeof x.payRate === 'number' ? `$${x.payRate} p/h` : (x.payRate ?? '$—'),
      date: x.date,
      time: `${x.startTime} - ${x.endTime}`,
      status: undefined, // show as "Available"
    }));
}

// Completed Shifts
function mapCompleted(s: ShiftDto[] | unknown): CompletedShift[] {
  const arr = Array.isArray(s) ? s : [];
  return arr
    .filter((x) => x.status === 'completed')
    .map((x) => ({
      id: x._id,
      title: x.title,
      company: x.createdBy?.company ?? '—',
      site: x.location ? `${x.location.suburb ?? ''} ${x.location.state ?? ''}`.trim() || '—' : '—',
      rate: typeof x.payRate === 'number' ? `$${x.payRate} p/h` : (x.payRate ?? '$—'),
      date: x.date,
      time: `${x.startTime} - ${x.endTime}`,
      rated: false,
      rating: 0,
    }));
}

// FilterModal with FlatList
function FilterModal({ visible, onClose, filters, setFilters, data }) {
  const toggleStatus = (status) => {
    setFilters((prev) => ({ ...prev, status: prev.status === status ? null : status }));
  };

  const toggleItem = (field: 'company' | 'site', item: string) => {
    setFilters((prev) => {
      const current = prev[field];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const resetFilters = () => {
    setFilters({ status: null, company: [], site: [] });
    onClose();
  };

  const companies = [...new Set(data.map((s) => s.company))];
  const sites = [...new Set(data.map((s) => s.site))];

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>Filter Shifts</Text>

          <Text style={s.modalLabel}>Status</Text>
          <View style={s.rowSpace}>
            {['Pending', 'Confirmed', 'Rejected'].map((status) => (
              <Pressable
                key={status}
                style={[s.tag, filters.status === status && s.tagSelected]}
                onPress={() => toggleStatus(status)}
              >
                <Text>{status}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.modalLabel}>Company</Text>
          <FlatList
            horizontal
            data={companies}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.tag, filters.company.includes(item) && s.tagSelected]}
                onPress={() => toggleItem('company', item)}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={s.modalLabel}>Location</Text>
          <FlatList
            horizontal
            data={sites}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.tag, filters.site.includes(item) && s.tagSelected]}
                onPress={() => toggleItem('site', item)}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <Pressable onPress={resetFilters} style={[s.modalCloseBtn, { backgroundColor: '#ccc' }]}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Reset Filters</Text>
          </Pressable>

          <Pressable onPress={onClose} style={s.modalCloseBtn}>
            <Text style={s.modalCloseText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function filterShifts(data, q, filters) {
  return data.filter((x) => {
    const qMatch = (x.title + x.createdBy?.company + x.site)
      .toLowerCase()
      .includes(q.toLowerCase());
    const statusMatch = !filters.status || x.status === filters.status;
    const companyMatch =
      filters.company.length === 0 || filters.company.includes(x.createdBy?.company);
    const siteMatch = filters.site.length === 0 || filters.site.includes(x.site);
    return qMatch && statusMatch && companyMatch && siteMatch;
  });
}

/* Search Bar (Shared for each tab) */
function Search({ q, setQ, onFilterPress }) {
  return (
    <View style={s.searchRow}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search shifts..."
        placeholderTextColor="#A0A7B1"
        style={s.search}
        accessibilityLabel="Search shifts"
        accessibilityRole="search"
      />
      <TouchableOpacity
        onPress={onFilterPress}
        style={s.filterBtn}
        accessibilityRole="button"
        accessibilityLabel="Open filter options"
      >
        <Text style={s.filterText}>☰</Text>
      </TouchableOpacity>
    </View>
  );
}

function Card({
  title,
  company,
  site,
  rate,
  children,
  onApply,
}: React.PropsWithChildren<{
  title: string;
  company: string;
  site: string;
  rate: string;
  onApply?: () => void;
}>) {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.muted}>{company}</Text>
          <Text style={s.muted}>{site}</Text>
        </View>
        <Text style={s.rate}>{rate}</Text>
      </View>
      {children}
      {onApply && (
        <TouchableOpacity style={s.applyBtn} onPress={onApply}>
          <Text style={s.applyText}>Apply</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* --- Applied tab --- */
function AppliedTab() {
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: null as null | 'Pending' | 'Confirmed' | 'Rejected',
    company: [] as string[],
    site: [] as string[],
  });

  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);

      // Fetch User Data
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found in storage');

      const decoded = parseJwt(token);
      const myUid = decoded?.id;
      if (!myUid) throw new Error('No user ID in token');

      const [mine, allResp] = await Promise.all([myShifts(), listShifts()]);

      const mineMapped = mapMineShifts(mine, myUid);
      const myIds = new Set(mineMapped.map((m) => m.id));
      const globalMapped = mapGlobalShifts(allResp.items, myIds);

      // dedupe by ID → prefer myShifts if exists
      const merged: AppliedShift[] = [];
      const seen = new Set<string>();

      [...mineMapped, ...globalMapped].forEach((shift) => {
        if (!seen.has(shift.id)) {
          seen.add(shift.id);
          merged.push(shift);
        }
      });

      setRows(merged);
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

  const colorFor = (st?: AppliedShift['status']) => {
    if (!st) return COLORS.link; // available
    if (st === 'Pending') return COLORS.status.pending;
    if (st === 'Confirmed') return COLORS.status.confirmed;
    return COLORS.status.rejected; // Rejected
  };

  const filtered = filterShifts(rows, q, filters);

  const onApply = async (id: string) => {
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

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} onFilterPress={() => setShowFilters(true)} />

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
        )}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        data={rows}
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

  const filtered = filterShifts(rows, q, filters);

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} onFilterPress={() => setShowFilters(true)} />

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

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        data={rows}
      />
    </View>
  );
}

/* Top Bar Container */
const Top = createMaterialTopTabNavigator();

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
