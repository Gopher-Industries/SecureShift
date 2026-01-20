import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

import { checkIn, checkOut } from '../api/attendance';

import { myShifts, applyToShift, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

const { width } = Dimensions.get('window');

/* -------------------- DEV MOCK (no backend) -------------------- */
const DEV_MOCK_SHIFTS = __DEV__ && true;

type AppliedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  status?: 'Pending' | 'Confirmed' | 'Rejected' | 'Checked In';
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
  attendanceStatus,
  onCheckIn,
  onCheckOut,
  loading,
}: {
  shift: AppliedShift | CompletedShift | null;
  visible: boolean;
  onClose: () => void;
  attendanceStatus?: 'in' | 'out' | null;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  loading?: boolean;
}) {
  if (!shift) return null;

  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed'
      ? '#10B981'
      : status === 'Pending'
        ? '#3B82F6'
        : status === 'Checked In'
          ? '#F59E0B'
          : '#6B7280';

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
              <Text style={s.modalRequirementsTitle}>Requirements:</Text>
              <View style={s.modalTags}>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>Security License</Text>
                </View>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>First Aid</Text>
                </View>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            {shift && 'status' in shift && shift.status === 'Confirmed' && attendanceStatus !== 'out' && (
              <View style={s.modalActions}>
                {attendanceStatus === 'in' ? (
                  <TouchableOpacity
                    style={[s.actionBtn, s.btnDanger, loading && s.btnDisabled]}
                    onPress={onCheckOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={s.actionBtnText}>Check Out</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.actionBtn, s.btnPrimary, loading && s.btnDisabled]}
                    onPress={onCheckIn}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={s.actionBtnText}>Check In</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* -------------------- Calendar Component -------------------- */

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
    if (status === 'Checked In') return '#F59E0B';
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
          <Text style={s.calLegendText}>Accepted</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: '#6B7280' }]} />
          <Text style={s.calLegendText}>Completed</Text>
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
    status === 'Confirmed'
      ? '#10B981'
      : status === 'Pending'
        ? '#3B82F6'
        : status === 'Checked In'
          ? '#F59E0B'
          : '#6B7280';

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
  const [selectedShift, setSelectedShift] = useState<AppliedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // Attendance State
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'in' | 'out'>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Load attendance map
  useEffect(() => {
    AsyncStorage.getItem('attendance_map').then((json) => {
      if (json) {
        try {
          setAttendanceMap(JSON.parse(json));
        } catch { }
      }
    });
  }, []);

  const updateAttendance = async (shiftId: string, status: 'in' | 'out') => {
    const newMap = { ...attendanceMap, [shiftId]: status };
    setAttendanceMap(newMap);
    await AsyncStorage.setItem('attendance_map', JSON.stringify(newMap));
  };

  const handleCheckIn = async () => {
    if (!selectedShift) return;
    try {
      setActionLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to check in.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await checkIn(selectedShift.id, loc.coords.latitude, loc.coords.longitude);

      await updateAttendance(selectedShift.id, 'in');
      Alert.alert('Success', 'Checked in successfully ✅');
    } catch (err: any) {
      if (err?.response?.data?.message) {
        Alert.alert('Check-in Failed', err.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to check in. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedShift) return;
    try {
      setActionLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to check out.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await checkOut(selectedShift.id, loc.coords.latitude, loc.coords.longitude);

      await updateAttendance(selectedShift.id, 'out');
      Alert.alert('Success', 'Checked out successfully ✅');
      setSelectedShift(null); // Close modal on completion? Or just update UI
    } catch (err: any) {
      if (err?.response?.data?.message) {
        Alert.alert('Check-out Failed', err.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to check out. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (DEV_MOCK_SHIFTS) {
        setRows(mockApplied);
        return;
      }
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No token');
      const decoded = parseJwt(token);
      const myUid = decoded?.id;
      const mine = await myShifts();
      setRows(mapMineShifts(mine, myUid));
    } catch {
      setRows(mockApplied);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const filtered = rows.filter((r) =>
    `${r.title}${r.company}${r.site}`.toLowerCase().includes(q.toLowerCase()),
  );

  const displayRows = filtered.map((s) => {
    if (attendanceMap[s.id] === 'in') {
      return { ...s, status: 'Checked In' as const };
    }
    return s;
  });

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

      {loading && <ActivityIndicator size="large" color={COLORS.primary} />}

      {view === 'calendar' ? (
        <CalendarView shifts={displayRows} onShiftPress={setSelectedShift} />
      ) : (
        <FlatList
          data={displayRows}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ShiftCard shift={item} onPress={() => setSelectedShift(item)} />
          )}
          ListEmptyComponent={<Text style={s.emptyText}>No shifts found</Text>}
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        attendanceStatus={selectedShift ? attendanceMap[selectedShift.id] : null}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        loading={actionLoading}
      />
    </View>
  );
}

/* -------------------- Completed Tab -------------------- */

function CompletedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CompletedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (DEV_MOCK_SHIFTS) {
        setRows(mockCompleted);
        return;
      }
      const resp = await myShifts('past');
      setRows(mapCompleted(resp));
    } catch {
      setRows(mockCompleted);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

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

      {loading && <ActivityIndicator size="large" color={COLORS.primary} />}

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
          borderRadius: 12,
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
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Search Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  viewToggleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  viewToggleIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  viewToggleIconActive: {
    color: '#FFFFFF',
  },

  // Shift Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  cardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardCompany: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 60,
  },
  cardValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  cardPay: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },

  // Calendar
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  calNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MODAL ACTIONS
  modalActions: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDanger: {
    backgroundColor: '#EF4444',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  calNavBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  calWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  calWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calDayCell: {
    width: (width - 32 - 16 * 2 - 24) / 7,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calDayCellDim: {
    opacity: 0.3,
  },
  calDayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  calDayNumberDim: {
    color: '#9CA3AF',
  },
  calShiftIndicators: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  calShiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calLegendText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2D3748',
    width: width - 48,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  modalBody: {
    gap: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalShiftTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalRequirements: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4A5568',
  },
  modalRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalTags: {
    flexDirection: 'row',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#4A5568',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalTagText: {
    fontSize: 12,
    color: '#E5E7EB',
  },

  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 40,
    fontSize: 14,
  },
});
