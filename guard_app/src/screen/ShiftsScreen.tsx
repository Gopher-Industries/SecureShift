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
} from 'react-native';

import { myShifts, applyToShift, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

/* -------------------- ✅ DEV MOCK (no backend) -------------------- */
const DEV_MOCK_SHIFTS = __DEV__ && true;

type AppliedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string; // ISO
  time: string;
  status?: 'Pending' | 'Confirmed' | 'Rejected';
};

type CompletedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string; // ISO
  time: string;
  rated: boolean;
  rating: number;
};

type FilterableShift = {
  title: string;
  company: string;
  site: string;
  status?: string;
  date: string;
};

const mockApplied: AppliedShift[] = [
  {
    id: 'a1',
    title: 'Night Patrol',
    company: 'SecureShift',
    site: 'Geelong VIC',
    rate: '$35 p/h',
    date: new Date().toISOString(),
    time: '22:00 - 06:00',
    status: 'Pending',
  },
  {
    id: 'a2',
    title: 'Mall Security',
    company: 'SecureShift',
    site: 'Melbourne VIC',
    rate: '$38 p/h',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    time: '10:00 - 18:00',
    status: undefined, // Available
  },
];

const mockCompleted: CompletedShift[] = [
  {
    id: 'c1',
    title: 'Event Security',
    company: 'SecureShift',
    site: 'Docklands VIC',
    rate: '$40 p/h',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    time: '18:00 - 23:00',
    rated: false,
    rating: 0,
  },
];

/* -------------------- Helpers -------------------- */

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // eslint-disable-next-line no-undef
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const canApply = (status?: AppliedShift['status']) => !status;

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
        rate: typeof s.payRate === 'number' ? `$${s.payRate} p/h` : '$—',
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
      rate: typeof s.payRate === 'number' ? `$${s.payRate} p/h` : '$—',
      date: s.date,
      time: `${s.startTime} - ${s.endTime}`,
      rated: false,
      rating: 0,
    }));
}

/* -------------------- Filter Logic -------------------- */

function filterShifts<T extends FilterableShift>(data: T[], q: string): T[] {
  const query = q.toLowerCase();
  return data.filter((s) => `${s.title}${s.company}${s.site}`.toLowerCase().includes(query));
}

/* -------------------- UI Components -------------------- */

function SearchBar({
  q,
  setQ,
  right,
}: {
  q: string;
  setQ: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.searchRow}>
      <TextInput value={q} onChangeText={setQ} placeholder="Search shifts..." style={s.search} />
      {right}
    </View>
  );
}

function Segment({
  value,
  onChange,
}: {
  value: 'list' | 'calendar';
  onChange: (v: 'list' | 'calendar') => void;
}) {
  return (
    <View style={s.segment}>
      <TouchableOpacity
        onPress={() => onChange('list')}
        style={[s.segmentBtn, value === 'list' && s.segmentBtnActive]}
      >
        <Text style={[s.segmentTxt, value === 'list' && s.segmentTxtActive]}>List</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange('calendar')}
        style={[s.segmentBtn, value === 'calendar' && s.segmentBtnActive]}
      >
        <Text style={[s.segmentTxt, value === 'calendar' && s.segmentTxtActive]}>Calendar</Text>
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
        <View style={s.flex1}>
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

function CalendarMonth<T extends { date: string }>({
  rows,
  selectedDate,
  onSelectDate,
}: {
  rows: T[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);

  const startWeekday = monthStart.getDay(); // 0=Sun
  const gridStart = addDays(monthStart, -startWeekday);

  const totalCells = 42; // 6 weeks grid
  const allCells = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));

  const byDateCount = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const k = dateKeyLocal(new Date(r.date));
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return map;
  }, [rows]);

  const monthLabel = monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={s.calWrap}>
      <View style={s.calHeader}>
        <TouchableOpacity
          onPress={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
          }
        >
          <Text style={s.calNav}>‹</Text>
        </TouchableOpacity>

        <Text style={s.calTitle}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
          }
        >
          <Text style={s.calNav}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.calWeekRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={`${d}-${i}`} style={s.calWeekTxt}>
            {d}
          </Text>
        ))}
      </View>

      <View style={s.calGrid}>
        {allCells.map((d) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const key = dateKeyLocal(d);
          const count = byDateCount.get(key) ?? 0;
          const isSelected = sameLocalDay(d, selectedDate);

          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelectDate(d)}
              style={[s.calCell, !inMonth && s.calCellDim, isSelected && s.calCellSelected]}
            >
              <Text style={[s.calDay, !inMonth && s.calDayDim, isSelected && s.calDaySelected]}>
                {d.getDate()}
              </Text>

              {count > 0 && <View style={s.calDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------- Applied Tab -------------------- */

function AppliedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      // keep UI alive even if backend fails
      setRows(mockApplied);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const filtered = filterShifts(rows, q);

  const listForSelectedDay = useMemo(() => {
    const key = dateKeyLocal(selectedDate);
    return filtered.filter((r) => dateKeyLocal(new Date(r.date)) === key);
  }, [filtered, selectedDate]);

  const apply = async (id: string) => {
    try {
      if (DEV_MOCK_SHIFTS) return; // in mock mode do nothing
      await applyToShift(id);
      fetchData();
    } catch {
      // ignore, UI tasks only
    }
  };

  return (
    <View style={s.screen}>
      <SearchBar
        q={q}
        setQ={setQ}
        right={
          <View style={s.segmentWrap}>
            <Segment value={mode} onChange={setMode} />
          </View>
        }
      />

      {loading && <ActivityIndicator />}

      {mode === 'calendar' ? (
        <>
          <CalendarMonth
            rows={filtered}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <Text style={s.sectionLabel}>
            {selectedDate.toLocaleDateString()} • {listForSelectedDay.length} shift(s)
          </Text>

          <FlatList
            data={listForSelectedDay}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <Card
                title={item.title}
                company={item.company}
                site={item.site}
                rate={item.rate}
                onApply={canApply(item.status) ? () => apply(item.id) : undefined}
              >
                <Text style={s.status}>Status: {item.status ?? 'Available'}</Text>
                <Text style={s.muted}>
                  {formatDate(item.date)} • {item.time}
                </Text>
              </Card>
            )}
            ListEmptyComponent={<Text style={s.empty}>No shifts on this date.</Text>}
          />
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Card
              title={item.title}
              company={item.company}
              site={item.site}
              rate={item.rate}
              onApply={canApply(item.status) ? () => apply(item.id) : undefined}
            >
              <Text style={s.status}>Status: {item.status ?? 'Available'}</Text>
              <Text style={s.muted}>
                {formatDate(item.date)} • {item.time}
              </Text>
            </Card>
          )}
          ListEmptyComponent={<Text style={s.empty}>No shifts found.</Text>}
        />
      )}
    </View>
  );
}

/* -------------------- Completed Tab -------------------- */

function CompletedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const filtered = filterShifts(rows, q);

  const listForSelectedDay = useMemo(() => {
    const key = dateKeyLocal(selectedDate);
    return filtered.filter((r) => dateKeyLocal(new Date(r.date)) === key);
  }, [filtered, selectedDate]);

  return (
    <View style={s.screen}>
      <SearchBar
        q={q}
        setQ={setQ}
        right={
          <View style={s.segmentWrap}>
            <Segment value={mode} onChange={setMode} />
          </View>
        }
      />

      {loading && <ActivityIndicator />}

      {mode === 'calendar' ? (
        <>
          <CalendarMonth
            rows={filtered}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <Text style={s.sectionLabel}>
            {selectedDate.toLocaleDateString()} • {listForSelectedDay.length} shift(s)
          </Text>

          <FlatList
            data={listForSelectedDay}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={s.card}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.muted}>
                  {formatDate(item.date)} • {item.time}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={s.empty}>No completed shifts on this date.</Text>}
          />
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.muted}>
                {formatDate(item.date)} • {item.time}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={s.empty}>No completed shifts found.</Text>}
        />
      )}
    </View>
  );
}

/* -------------------- Tabs -------------------- */

const Top = createMaterialTopTabNavigator();

export default function ShiftsScreen() {
  return (
    <Top.Navigator>
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}

/* -------------------- Styles -------------------- */

const s = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: COLORS.bg },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8 },

  segmentWrap: { marginLeft: 8 },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  segmentBtnActive: { backgroundColor: '#e3ecff' },
  segmentTxt: { color: '#111', fontWeight: '600' },
  segmentTxtActive: { color: COLORS.primary },

  card: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 16 },
  muted: { color: COLORS.muted },
  rate: { fontWeight: '700' },
  status: { marginTop: 6 },
  empty: { marginTop: 10, color: COLORS.muted },

  applyBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700' },

  sectionLabel: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: '#111' },

  calWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calTitle: { fontWeight: '800', color: '#111' },
  calNav: { fontSize: 22, fontWeight: '900', paddingHorizontal: 8 },

  calWeekRow: { flexDirection: 'row', marginTop: 10, marginBottom: 6 },
  calWeekTxt: { width: `${100 / 7}%`, textAlign: 'center', color: COLORS.muted, fontWeight: '700' },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calCellDim: { opacity: 0.35 },
  calCellSelected: { backgroundColor: '#e3ecff' },

  calDay: { fontWeight: '800', color: '#111' },
  calDayDim: { color: COLORS.muted },
  calDaySelected: { color: COLORS.primary },

  calDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: COLORS.primary,
  },
});
