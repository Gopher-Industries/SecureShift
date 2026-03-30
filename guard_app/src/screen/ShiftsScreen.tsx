import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

import { getMe } from '../api/auth';
import { myShifts, type ShiftDto } from '../api/shifts';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

const { width } = Dimensions.get('window');

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

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

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

function ShiftDetailsModal({
  shift,
  visible,
  onClose,
  colors,
}: {
  shift: AppliedShift | CompletedShift | null;
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
}) {
  const s = getStyles(colors);

  if (!shift) return null;

  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed'
      ? colors.status.confirmed
      : status === 'Pending'
        ? colors.link
        : colors.muted;

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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CalendarView<T extends { id: string; date: string; title: string; status?: string }>({
  shifts,
  onShiftPress,
  colors,
}: {
  shifts: T[];
  onShiftPress: (shift: T) => void;
  colors: AppColors;
}) {
  const s = getStyles(colors);
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
    if (status === 'Confirmed') return colors.status.confirmed;
    if (status === 'Pending') return colors.link;
    return colors.muted;
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
          <View style={[s.calLegendDot, { backgroundColor: colors.link }]} />
          <Text style={s.calLegendText}>Applied</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.status.confirmed }]} />
          <Text style={s.calLegendText}>Accepted</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.muted }]} />
          <Text style={s.calLegendText}>Completed</Text>
        </View>
      </View>
    </View>
  );
}

function ShiftCard({
  shift,
  onPress,
  colors,
}: {
  shift: AppliedShift | CompletedShift;
  onPress?: () => void;
  colors: AppColors;
}) {
  const s = getStyles(colors);

  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed'
      ? colors.status.confirmed
      : status === 'Pending'
        ? colors.link
        : colors.muted;

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

function ViewToggle({
  view,
  onViewChange,
  colors,
}: {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  colors: AppColors;
}) {
  const s = getStyles(colors);

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

function AppliedTab() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AppliedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMe();
      const myUid = me?._id ?? me?.id;
      if (!myUid) {
        setRows([]);
        return;
      }
      const mine = await myShifts();
      setRows(mapMineShifts(mine, myUid));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} colors={colors} />
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} />}

      {view === 'calendar' ? (
        <CalendarView shifts={filtered} onShiftPress={setSelectedShift} colors={colors} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ShiftCard shift={item} onPress={() => setSelectedShift(item)} colors={colors} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={s.emptyText}>No shifts found</Text>}
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        colors={colors}
      />
    </View>
  );
}

function CompletedTab() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CompletedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await myShifts('past');
      setRows(mapCompleted(resp));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} colors={colors} />
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} />}

      {view === 'calendar' ? (
        <CalendarView
          shifts={filtered.map((s) => ({ ...s, status: 'Completed' }))}
          onShiftPress={setSelectedShift}
          colors={colors}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ShiftCard shift={item} onPress={() => setSelectedShift(item)} colors={colors} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={s.emptyText}>No completed shifts found</Text>}
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        colors={colors}
      />
    </View>
  );
}

const Top = createMaterialTopTabNavigator();

export default function ShiftsScreen() {
  const { colors } = useAppTheme();

  return (
    <Top.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.primarySoft,
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: '100%',
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          textTransform: 'none',
          fontSize: 14,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingTop: 12,
    },

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
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },

    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    viewToggleBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewToggleBtnActive: {
      backgroundColor: colors.primary,
    },
    viewToggleIcon: {
      fontSize: 18,
      color: colors.muted,
    },
    viewToggleIconActive: {
      color: colors.white,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
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
      color: colors.white,
    },
    cardCompany: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 12,
    },
    cardRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    cardLabel: {
      fontSize: 13,
      color: colors.muted,
      width: 60,
    },
    cardValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    cardPay: {
      fontSize: 13,
      color: colors.status.confirmed,
      fontWeight: '700',
    },

    calendarContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    calNavButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    calNavBtn: {
      width: 32,
      height: 32,
      backgroundColor: colors.primarySoft,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calNavBtnText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
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
      color: colors.muted,
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
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      backgroundColor: colors.card,
    },
    calDayCellDim: {
      opacity: 0.3,
    },
    calDayNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    calDayNumberDim: {
      color: colors.muted,
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
      borderTopColor: colors.border,
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
      color: colors.muted,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      width: width - 48,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    modalCloseBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 20,
      color: colors.muted,
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
      color: colors.text,
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
      color: colors.white,
    },
    modalDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    modalValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    modalRequirements: {
      marginTop: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalRequirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modalTags: {
      flexDirection: 'row',
      gap: 8,
    },
    modalTag: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    modalTagText: {
      fontSize: 12,
      color: colors.text,
    },

    emptyText: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 40,
      fontSize: 14,
    },
  });
