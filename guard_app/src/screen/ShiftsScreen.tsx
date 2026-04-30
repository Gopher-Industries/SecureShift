import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getMe } from '../api/auth';
import { applyToShift, listShifts, myShifts, type ShiftDto } from '../api/shifts';
import ShiftCard from '../components/card/ShiftCard';
import CalendarView from '../components/calendar/CalendarView';
import ShiftDetailsModal from '../components/modal/ShiftDetailsModal';
import ViewToggle from '../components/toggle/ViewToggle';
import { useAppTheme } from '../theme';
import type { AllShift, AppliedShift, CompletedShift } from '../models/Shifts';

import type { AppColors } from '../theme/colors';

const { width } = Dimensions.get('window');

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

function mapAllShifts(shifts: ShiftDto[], myUid: string): AllShift[] {
  return shifts
    .filter((s) => s.status !== 'completed')
    .map((s) => {
      const acceptedId =
        typeof s.acceptedBy === 'object' ? s.acceptedBy?._id : String(s.acceptedBy ?? '');

      const applicants = Array.isArray(s.applicants)
        ? s.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      let status: AllShift['status'] = 'Available';

      if (s.status === 'assigned' && acceptedId === myUid) status = 'Confirmed';
      else if (applicants.includes(myUid) || s.status === 'applied') status = 'Pending';

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
function AllTab() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AllShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AllShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMe();
      const myUid = me?._id ?? me?.id ?? '';

      const resp = await listShifts();
      const mapped = mapAllShifts(resp.items, myUid);
      setRows(mapped);
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

  const handleApply = async (shiftId: string) => {
    try {
      setApplyingId(shiftId);
      await applyToShift(shiftId);
      Alert.alert('Success', 'Shift applied successfully');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Apply Failed', error?.response?.data?.message ?? 'Could not apply for shift');
    } finally {
      setApplyingId(null);
    }
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
            placeholder={t('shifts.search')}
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
            <ShiftCard
              shift={item}
              onPress={() => setSelectedShift(item)}
              colors={colors}
              showApply
              onApply={() => handleApply(item.id)}
              applying={applyingId === item.id}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={s.emptyText}>{t('shifts.noShifts')}</Text>}
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

function AppliedTab() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

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
            placeholder={t('shifts.search')}
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
          ListEmptyComponent={<Text style={s.emptyText}>{t('shifts.noShifts')}</Text>}
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
  const { t } = useTranslation();

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
            placeholder={t('shifts.search')}
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} colors={colors} />
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} />}

      {view === 'calendar' ? (
        <CalendarView
          shifts={filtered.map((s) => ({ ...s, status: 'Completed' as const }))}
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
          ListEmptyComponent={<Text style={s.emptyText}>{t('shifts.noCompleted')}</Text>}
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
  const { t } = useTranslation();

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
      <Top.Screen name="All" component={AllTab} options={{ tabBarLabel: t('shifts.all') }} />
      <Top.Screen
        name="Applied"
        component={AppliedTab}
        options={{ tabBarLabel: t('shifts.applied') }}
      />
      <Top.Screen
        name="Completed"
        component={CompletedTab}
        options={{ tabBarLabel: t('shifts.completed') }}
      />
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

    emptyText: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 40,
      fontSize: 14,
    },
  });
