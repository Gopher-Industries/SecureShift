import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
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

import { listShifts, myShifts, applyToShift, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

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

type ShiftFilters = {
  status: null | 'Pending' | 'Confirmed' | 'Rejected';
  company: string[];
  site: string[];
};

type FilterableShift = {
  title: string;
  company: string;
  site: string;
  status?: string;
};

const canApply = (status?: AppliedShift['status']) => !status;

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

function filterShifts<T extends FilterableShift>(data: T[], q: string, filters: ShiftFilters): T[] {
  const query = q.toLowerCase();

  return data.filter((s) => {
    const matchesQuery = `${s.title}${s.company}${s.site}`.toLowerCase().includes(query);
    const matchesStatus = !filters.status || s.status === filters.status;
    const matchesCompany = filters.company.length === 0 || filters.company.includes(s.company);
    const matchesSite = filters.site.length === 0 || filters.site.includes(s.site);

    return matchesQuery && matchesStatus && matchesCompany && matchesSite;
  });
}

/* -------------------- UI Components -------------------- */

type SearchProps = {
  q: string;
  setQ: (v: string) => void;
  onFilter: () => void;
};

function SearchBar({ q, setQ, onFilter }: SearchProps) {
  return (
    <View style={s.searchRow}>
      <TextInput value={q} onChangeText={setQ} placeholder="Search shifts..." style={s.search} />
      <TouchableOpacity onPress={onFilter} style={s.filterBtn}>
        <Text>☰</Text>
      </TouchableOpacity>
    </View>
  );
}

type CardProps = React.PropsWithChildren<{
  title: string;
  company: string;
  site: string;
  rate: string;
  onApply?: () => void;
}>;

function Card({ title, company, site, rate, children, onApply }: CardProps) {
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

/* -------------------- Applied Tab -------------------- */

function AppliedTab() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ShiftFilters>({
    status: null,
    company: [],
    site: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No token');

      const decoded = parseJwt(token);
      const myUid = decoded?.id;

      const mine = await myShifts();
      const mapped = mapMineShifts(mine, myUid);

      setRows(mapped);
    } catch (e) {
      Alert.alert('Error', 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const filtered = filterShifts(rows, q, filters);

  const apply = async (id: string) => {
    try {
      await applyToShift(id);
      Alert.alert('Applied', 'Application sent');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to apply');
    }
  };

  return (
    <View style={s.screen}>
      <SearchBar q={q} setQ={setQ} onFilter={() => {}} />

      {loading && <ActivityIndicator />}

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
      />
    </View>
  );
}

/* -------------------- Completed Tab -------------------- */

function CompletedTab() {
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={s.screen}>
      {loading && <ActivityIndicator />}
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.muted}>
              {formatDate(item.date)} • {item.time}
            </Text>
          </View>
        )}
      />
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
  searchRow: { flexDirection: 'row', marginBottom: 12 },
  search: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  filterBtn: { marginLeft: 8, padding: 10, backgroundColor: '#fff', borderRadius: 8 },

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

  applyBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700' },
});
