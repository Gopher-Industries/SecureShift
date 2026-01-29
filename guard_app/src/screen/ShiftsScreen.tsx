import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';

import { myShifts, applyToShift, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

/* -------------------- DEV MOCK (no backend) -------------------- */
const DEV_MOCK_SHIFTS = false; // Set to true for development, false for production

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

const mockApplied: AppliedShift[] = [
  {
    id: 'a1',
    title: 'Security Guard - Night',
    company: 'Downtown Mall',
    site: 'Downtown Mall',
    rate: '$25/hour',
    date: new Date(2025, 10, 28).toISOString(),
    time: '10:00PM - 6:00 AM',
    status: 'Confirmed',
  },
  {
    id: 'a2',
    title: 'Event Security',
    company: 'Convention Center',
    site: 'Convention Center',
    rate: '$28/hour',
    date: new Date(2025, 10, 25).toISOString(),
    time: '2:00 PM - 10:00 PM',
    status: 'Confirmed',
  },
  {
    id: 'a3',
    title: 'Warehouse Security',
    company: 'Industrial Park',
    site: 'Industrial Park',
    rate: '$24/hour',
    date: new Date(2025, 10, 30).toISOString(),
    time: '8:00 AM - 2:00 PM',
    status: 'Pending',
  },
];

const mockCompleted: CompletedShift[] = [
  {
    id: 'c1',
    title: 'Night Patrol',
    company: 'Shopping Mall',
    site: 'Westfield Mall',
    rate: '$26/hour',
    date: new Date(2025, 10, 15).toISOString(),
    time: '10:00 PM - 6:00 AM',
    rated: true,
    rating: 5,
  },
  {
    id: 'c2',
    title: 'Event Security',
    company: 'Concert Hall',
    site: 'City Arena',
    rate: '$30/hour',
    date: new Date(2025, 10, 20).toISOString(),
    time: '6:00 PM - 12:00 AM',
    rated: false,
    rating: 0,
  },
];

/* -------------------- Helpers -------------------- */

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/* -------------------- Mapping -------------------- */

function mapMineShifts(shifts: ShiftDto[], myUid: string): AppliedShift[] {
  return shifts
    .filter((s) => s.status !== 'completed')
    .map((s) => {
      const acceptedId =
        typeof s.acceptedBy === 'object' ? s.acceptedBy?._id : String(s.acceptedBy ?? '');
      const applicants = Array.isArray(s.applicants)
        ? s.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      let status: AppliedShift['status'];
      if (s.status === 'assigned' && acceptedId === myUid) status = 'Confirmed';
      else if (s.status === 'assigned' && applicants.includes(myUid)) status = 'Rejected';
      else if (s.status === 'applied') status = 'Pending';

      return {
        id: s._id,
        title: s.title,
        company: s.createdBy?.company ?? '—',
        site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
        rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        status,
      };
    });
}

function mapCompleted(shifts: ShiftDto[]): CompletedShift[] {
  return shifts
    .filter((s) => s.status === 'completed')
    .map((s) => ({
      id: s._id,
      title: s.title,
      company: s.createdBy?.company ?? '—',
      site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
      rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
      date: s.date,
      time: `${s.startTime} - ${s.endTime}`,
      rated: false,
      rating: 0,
    }));
}

/* -------------------- Shift Details Modal -------------------- */

function ShiftDetailsModal({
  shift,
  visible,
  onClose,
}: {
  shift: AppliedShift | CompletedShift | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!shift) return null;

  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed' ? '#10B981' : status === 'Pending' ? '#3B82F6' : '#6B7280';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Shift Details</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <View style={s.modalTitleRow}>
              <Text style={s.modalShiftTitle}>{shift.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={s.statusBadgeText}>{status || 'Available'}</Text>
              </View>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>Date:</Text>
              <Text style={s.modalValue}>
                {new Date(shift.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>Time:</Text>
              <Text style={s.modalValue}>{shift.time}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>Location:</Text>
              <Text style={s.modalValue}>{shift.site}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>Pay Rate:</Text>
              <Text style={s.modalValue}>{shift.rate}</Text>
            </View>

            <View style={s.modalRequirements}>
              <Text style={s.modalLabel}>Requirements:</Text>
              <Text style={s.modalReqText}>• Security License</Text>
              <Text style={s.modalReqText}>• First Aid Certificate</Text>
            </View>
          </View>

          <TouchableOpacity style={s.modalCloseButton} onPress={onClose}>
            <Text style={s.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* -------------------- Calendar View -------------------- */

function CalendarView<T extends { id: string; date: string; title: string; status?: string }>({
  shifts,
  onShiftPress,
}: {
  shifts: T[];
  onShiftPress: (shift: T) => void;
}) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const gridStart = addDays(monthStart, -startWeekday);

  const totalCells = 42;
  const allCells = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, T[]>();
    shifts.forEach((shift) => {
      const key = dateKeyLocal(new Date(shift.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shift);
    });
    return map;
  }, [shifts]);

  const monthLabel = monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const getStatusColor = (status?: string) => {
    if (status === 'Confirmed') return '#10B981';
    if (status === 'Pending') return '#3B82F6';
    return '#6B7280';
  };

  return (
    <View style={s.calendarContainer}>
      <View style={s.calHeader}>
        <Text style={s.calMonthText}>{monthLabel}</Text>
        <View style={s.calNavButtons}>
          <TouchableOpacity
            onPress={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
            }
            style={s.calNavBtn}
          >
            <Text style={s.calNavBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
            }
            style={s.calNavBtn}
          >
            <Text style={s.calNavBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.calWeekHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <View key={i} style={s.calWeekCell}>
            <Text style={s.calWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={s.calGrid}>
        {allCells.map((d, idx) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const key = dateKeyLocal(d);
          const dayShifts = shiftsByDate.get(key) || [];
          const hasShifts = dayShifts.length > 0;

          return (
            <TouchableOpacity
              key={idx}
              style={[s.calDayCell, !inMonth && s.calDayCellDim]}
              onPress={() => hasShifts && onShiftPress(dayShifts[0])}
              disabled={!hasShifts}
            >
              <Text style={[s.calDayNumber, !inMonth && s.calDayNumberDim]}>{d.getDate()}</Text>
              {hasShifts && (
                <View style={s.calShiftIndicators}>
                  {dayShifts.slice(0, 3).map((shift, i) => (
                    <View
                      key={i}
                      style={[s.calShiftDot, { backgroundColor: getStatusColor(shift.status) }]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.calLegend}>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={s.calLegendText}>Applied</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: '#10B981' }]} />
          <Text style={s.calLegendText}>Confirmed</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={s.calLegendText}>Rejected</Text>
        </View>
      </View>
    </View>
  );
}

/* -------------------- List Card -------------------- */

function ShiftCard({
  shift,
  onPress,
}: {
  shift: AppliedShift | CompletedShift;
  onPress?: () => void;
}) {
  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed' ? '#10B981' : status === 'Pending' ? '#3B82F6' : '#6B7280';

  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleSection}>
          <Text style={s.cardTitle}>{shift.title}</Text>
          <View style={[s.cardStatusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.cardStatusText}>{status || 'Available'}</Text>
          </View>
        </View>
      </View>

      <Text style={s.cardCompany}>{shift.company}</Text>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>Date:</Text>
        <Text style={s.cardValue}>
          {new Date(shift.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>Time:</Text>
        <Text style={s.cardValue}>{shift.time}</Text>
      </View>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>Pay:</Text>
        <Text style={s.cardPay}>{shift.rate}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------- View Toggle Button -------------------- */

function ViewToggle({
  view,
  onViewChange,
}: {
  view: 'list' | 'calendar';
  onViewChange: (v: 'list' | 'calendar') => void;
}) {
  return (
    <View style={s.viewToggle}>
      <TouchableOpacity
        style={[s.viewToggleBtn, view === 'list' && s.viewToggleBtnActive]}
        onPress={() => onViewChange('list')}
      >
        <Text style={[s.viewToggleIcon, view === 'list' && s.viewToggleIconActive]}>☰</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.viewToggleBtn, view === 'calendar' && s.viewToggleBtnActive]}
        onPress={() => onViewChange('calendar')}
      >
        <Text style={[s.viewToggleIcon, view === 'calendar' && s.viewToggleIconActive]}>📅</Text>
      </TouchableOpacity>
    </View>
  );
}

/* -------------------- Applied Tab -------------------- */

function AppliedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AppliedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (DEV_MOCK_SHIFTS) {
        // Development mode: use mock data
        setRows(mockApplied);
        return;
      }

      // Production mode: fetch from real API
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found');
        setRows([]);
        return;
      }

      const decoded = parseJwt(token);
      const myUid = decoded?.id || decoded?.userId;

      if (!myUid) {
        console.warn('Could not decode user ID from token');
        setRows([]);
        return;
      }

      // GET /api/v1/shifts/myshifts
      const mine = await myShifts();
      console.log('✅ Fetched shifts from API:', mine.length);

      // Map backend data to frontend format
      const mapped = mapMineShifts(mine, myUid);
      setRows(mapped);

      // Cache for offline access
      await AsyncStorage.setItem('cached_applied_shifts', JSON.stringify(mapped));
    } catch (error) {
      console.error('❌ Error fetching applied shifts:', error);

      // Fallback to cached data
      try {
        const cached = await AsyncStorage.getItem('cached_applied_shifts');
        if (cached) {
          console.log('📦 Using cached applied shifts');
          setRows(JSON.parse(cached));
        } else {
          setRows([]);
        }
      } catch (cacheError) {
        console.error('Error reading cache:', cacheError);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filtered = rows.filter((r) =>
    `${r.title}${r.company}${r.site}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <View style={s.screen}>
      <View style={s.searchRow}>
        <View style={s.searchContainer}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search shifts..."
            placeholderTextColor="#9CA3AF"
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} />
      </View>

      {loading && !refreshing && <ActivityIndicator size="large" color={COLORS.primary} />}

      {view === 'calendar' ? (
        <CalendarView shifts={filtered} onShiftPress={setSelectedShift} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ShiftCard shift={item} onPress={() => setSelectedShift(item)} />
          )}
          ListEmptyComponent={<Text style={s.emptyText}>No shifts found</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
      />
    </View>
  );
}

/* -------------------- Completed Tab -------------------- */

function CompletedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CompletedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (DEV_MOCK_SHIFTS) {
        // Development mode: use mock data
        setRows(mockCompleted);
        return;
      }

      // Production mode: fetch from real API
      // GET /api/v1/shifts/myshifts?status=past
      const resp = await myShifts('past');
      console.log('✅ Fetched completed shifts from API:', resp.length);

      // Map backend data to frontend format
      const mapped = mapCompleted(resp);
      setRows(mapped);

      // Cache for offline access
      await AsyncStorage.setItem('cached_completed_shifts', JSON.stringify(mapped));
    } catch (error) {
      console.error('❌ Error fetching completed shifts:', error);

      // Fallback to cached data
      try {
        const cached = await AsyncStorage.getItem('cached_completed_shifts');
        if (cached) {
          console.log('📦 Using cached completed shifts');
          setRows(JSON.parse(cached));
        } else {
          setRows([]);
        }
      } catch (cacheError) {
        console.error('Error reading cache:', cacheError);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filtered = rows.filter((r) =>
    `${r.title}${r.company}${r.site}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <View style={s.screen}>
      <View style={s.searchRow}>
        <View style={s.searchContainer}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search shifts..."
            placeholderTextColor="#9CA3AF"
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} />
      </View>

      {loading && !refreshing && <ActivityIndicator size="large" color={COLORS.primary} />}

      {view === 'calendar' ? (
        <CalendarView
          shifts={filtered.map((s) => ({ ...s, status: 'Completed' }))}
          onShiftPress={setSelectedShift}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ShiftCard shift={item} onPress={() => setSelectedShift(item)} />
          )}
          ListEmptyComponent={<Text style={s.emptyText}>No completed shifts found</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
      />
    </View>
  );
}

/* -------------------- Tabs -------------------- */

const Top = createMaterialTopTabNavigator();

export default function ShiftsScreen() {
  return (
    <Top.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#E5E7EB',
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
        },
        tabBarIndicatorStyle: {
          backgroundColor: COLORS.primary,
          height: '100%',
          borderRadius: 10,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          textTransform: 'none',
          fontSize: 14,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}

/* -------------------- Styles -------------------- */

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  viewToggleBtnActive: { backgroundColor: COLORS.primary },
  viewToggleIcon: { fontSize: 18 },
  viewToggleIconActive: { opacity: 1 },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 40,
    fontSize: 15,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { marginBottom: 8 },
  cardTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  cardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardStatusText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  cardCompany: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  cardRow: { flexDirection: 'row', marginBottom: 4 },
  cardLabel: { fontSize: 14, color: '#6B7280', width: 60 },
  cardValue: { fontSize: 14, color: '#111827', flex: 1 },
  cardPay: { fontSize: 14, color: COLORS.primary, fontWeight: '600', flex: 1 },

  // Calendar
  calendarContainer: { flex: 1 },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  calMonthText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  calNavButtons: { flexDirection: 'row', gap: 8 },
  calNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  calNavBtnText: { fontSize: 20, fontWeight: '600', color: COLORS.primary },
  calWeekHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  calWeekCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  calWeekText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#FFFFFF' },
  calDayCell: {
    width: width / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    padding: 4,
  },
  calDayCellDim: { opacity: 0.3 },
  calDayNumber: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  calDayNumberDim: { color: '#9CA3AF' },
  calShiftIndicators: { flexDirection: 'row', gap: 2 },
  calShiftDot: { width: 6, height: 6, borderRadius: 3 },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calLegendDot: { width: 10, height: 10, borderRadius: 5 },
  calLegendText: { fontSize: 12, color: '#6B7280' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 24, color: '#6B7280' },
  modalBody: { padding: 20 },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalShiftTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  modalDetail: { flexDirection: 'row', marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', width: 80 },
  modalValue: { fontSize: 14, color: '#111827', flex: 1 },
  modalRequirements: { marginTop: 8 },
  modalReqText: { fontSize: 14, color: '#111827', marginLeft: 12, marginTop: 4 },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
