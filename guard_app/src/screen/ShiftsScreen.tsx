import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getUserAttendance, type Attendance } from '../api/attendance';
import { getMe } from '../api/auth';
import { applyToShift, listShifts, myShifts, type ShiftDto } from '../api/shifts';
import CalendarView from '../components/calendar/CalendarView';
import ShiftCard from '../components/card/ShiftCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ShiftDetailsModal from '../components/modal/ShiftDetailsModal';
import ViewToggle from '../components/toggle/ViewToggle';
import { useAppTheme } from '../theme';

import type { AllShift, AppliedShift, CompletedShift } from '../models/Shifts';
import type { AppColors } from '../theme/colors';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

function mapMineShifts(
  shifts: ShiftDto[],
  myUid: string,
  attendanceRecords: Attendance[] = [],
): AppliedShift[] {
  return shifts
    .filter((s) => s.status !== 'completed')
    .map((s) => {
      const acceptedId =
        typeof s.acceptedBy === 'object' ? s.acceptedBy?._id : String(s.acceptedBy ?? '');

      const applicants = Array.isArray(s.applicants)
        ? s.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      const attendance = attendanceRecords.find(
        (record) => String(record.shiftId) === String(s._id),
      );

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
        attendance: attendance
          ? {
              checkInTime: attendance.checkInTime ?? undefined,
              checkOutTime: attendance.checkOutTime ?? undefined,
            }
          : undefined,
      };
    });
}

function mapCompleted(shifts: ShiftDto[], attendanceRecords: Attendance[] = []): CompletedShift[] {
  return shifts
    .filter((s) => s.status === 'completed')
    .map((s) => {
      const attendance = attendanceRecords.find(
        (record) => String(record.shiftId) === String(s._id),
      );

      return {
        id: s._id,
        title: s.title,
        company: s.createdBy?.company ?? '—',
        site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
        rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        rated: false,
        rating: 0,
        attendance: attendance
          ? {
              checkInTime: attendance.checkInTime ?? undefined,
              checkOutTime: attendance.checkOutTime ?? undefined,
            }
          : undefined,
      };
    });
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

function AllTab({ navigation }: Props) {
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

  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Pending' | 'Confirmed'>(
    'All',
  );

  const [sortOption, setSortOption] = useState<'dateAsc' | 'dateDesc' | 'payAsc' | 'payDesc'>(
    'dateAsc',
  );
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const me = await getMe();
      const myUid = me?._id ?? me?.id ?? '';

      const resp = await listShifts(1, 50);
      setRows(mapAllShifts(resp.items, myUid));
    } catch (err: any) {
      setRows([]);
      setError(
        err?.response?.data?.message ?? err?.message ?? 'Unable to load shifts. Please try again.',
      );
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

  const submitApplication = async (shiftId: string) => {
    try {
      setApplyingId(shiftId);

      await applyToShift(shiftId);

      Alert.alert('Success', 'Shift applied successfully');
      await fetchData();
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      const message = apiError.response?.data?.message ?? 'Could not apply for shift';

      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('already applied') ||
        normalizedMessage.includes('duplicate')
      ) {
        Alert.alert('Already Applied', 'You have already applied for this shift.');
      } else if (
        normalizedMessage.includes('already taken') ||
        normalizedMessage.includes('not available') ||
        normalizedMessage.includes('filled') ||
        normalizedMessage.includes('assigned')
      ) {
        Alert.alert('Shift Unavailable', 'This shift is no longer available.');
      } else {
        Alert.alert('Apply Failed', message);
      }
    } finally {
      setApplyingId(null);
    }
  };

  const handleApply = (shiftId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to apply for this shift?');

      if (confirmed) {
        void submitApplication(shiftId);
      }

      return;
    }

    Alert.alert('Confirm Application', 'Are you sure you want to apply for this shift?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Apply',
        onPress: () => void submitApplication(shiftId),
      },
    ]);
  };
  const filtered = rows
    .filter((shift) =>
      `${shift.title} ${shift.company} ${shift.site}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
    )

    .filter((shift) => statusFilter === 'All' || shift.status === statusFilter)
    .filter((shift) => {
      if (dateFilter === 'all') return true;

      const shiftDate = new Date(shift.date);
      const today = new Date();

      shiftDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        return shiftDate.getTime() === today.getTime();
      }

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      return shiftDate >= today && shiftDate <= endOfWeek;
    })
    .sort((a, b) => {
      if (sortOption === 'dateAsc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (sortOption === 'dateDesc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      const payA = Number(a.rate.replace(/[^0-9.]/g, '')) || 0;
      const payB = Number(b.rate.replace(/[^0-9.]/g, '')) || 0;

      return sortOption === 'payAsc' ? payA - payB : payB - payA;
    });

  const handleViewRequests = () => {
    navigation.navigate('ShiftRequests');
  };

  return (
    <View style={s.screen}>
      <TouchableOpacity style={s.requestsButton} onPress={handleViewRequests}>
        <Text style={s.requestsText}>{t('shifts.viewRequests')}</Text>
      </TouchableOpacity>
      <View style={s.searchRow}>
        <View style={s.searchContainer}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            accessible={true}
            accessibilityLabel={t('shifts.search')}
            value={q}
            onChangeText={setQ}
            placeholder={t('shifts.search')}
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>
        <ViewToggle view={view} onViewChange={setView} colors={colors} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.controlsRow}
      >
        {(['All', 'Available', 'Pending', 'Confirmed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[s.controlButton, statusFilter === status && s.controlButtonActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[s.controlButtonText, statusFilter === status && s.controlButtonTextActive]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.controlsRow}
      >
        {[
          { label: 'Any date', value: 'all' },
          { label: 'Today', value: 'today' },
          { label: 'Next 7 days', value: 'week' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[s.controlButton, dateFilter === option.value && s.controlButtonActive]}
            onPress={() => setDateFilter(option.value as 'all' | 'today' | 'week')}
          >
            <Text
              style={[
                s.controlButtonText,
                dateFilter === option.value && s.controlButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.controlsRow}
      >
        {[
          { label: 'Date ↑', value: 'dateAsc' },
          { label: 'Date ↓', value: 'dateDesc' },
          { label: 'Pay ↑', value: 'payAsc' },
          { label: 'Pay ↓', value: 'payDesc' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[s.controlButton, sortOption === option.value && s.controlButtonActive]}
            onPress={() =>
              setSortOption(option.value as 'dateAsc' | 'dateDesc' | 'payAsc' | 'payDesc')
            }
          >
            <Text
              style={[
                s.controlButtonText,
                sortOption === option.value && s.controlButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && <LoadingState />}

      {error ? (
        <View style={s.errorContainer}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchData}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : view === 'calendar' ? (
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
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title={t('shifts.noShifts')} />}
        />
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        colors={colors}
        onApply={() => {
          if (selectedShift) {
            handleApply(selectedShift.id);
          }
        }}
        applying={selectedShift ? applyingId === selectedShift.id : false}
      />
    </View>
  );
}

function AppliedTab({ navigation }: Props) {
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
      const [mine, attendanceRecords] = await Promise.all([myShifts(), getUserAttendance(myUid)]);

      setRows(mapMineShifts(mine, myUid, attendanceRecords));
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
    `${r.title} ${r.company} ${r.site}`.toLowerCase().includes(q.toLowerCase()),
  );

  const handleViewRequests = () => {
    navigation.navigate('ShiftRequests');
  };

  return (
    <View style={s.screen}>
      <TouchableOpacity style={s.requestsButton} onPress={handleViewRequests}>
        <Text style={s.requestsText}>{t('shifts.viewRequests')}</Text>
      </TouchableOpacity>
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

      {loading && <LoadingState />}

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
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title={t('shifts.noShifts')} />}
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

function CompletedTab({ navigation }: Props) {
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

      const me = await getMe();
      const myUid = me?._id ?? me?.id;

      const [resp, attendanceRecords] = await Promise.all([
        myShifts('past'),
        myUid ? getUserAttendance(myUid) : Promise.resolve([]),
      ]);

      setRows(mapCompleted(resp, attendanceRecords));
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

  const handleViewRequests = () => {
    navigation.navigate('ShiftRequests');
  };

  return (
    <View style={s.screen}>
      <TouchableOpacity style={s.requestsButton} onPress={handleViewRequests}>
        <Text style={s.requestsText}>{t('shifts.viewRequests')}</Text>
      </TouchableOpacity>
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

      {loading && <LoadingState />}

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
          ListEmptyComponent={
            <EmptyState icon="checkmark-done-outline" title={t('shifts.noCompleted')} />
          }
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

export default function ShiftsScreen({ navigation }: any) {
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

    requestsButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 5,
      marginBottom: 12,
      alignSelf: 'center',
    },
    requestsText: {
      color: colors.white,
      fontSize: 14,
      margin: 8,
      alignSelf: 'center',
    },

    controlsRow: {
      gap: 8,
      paddingBottom: 10,
    },

    controlButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    controlButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    controlButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },

    controlButtonTextActive: {
      color: colors.white,
    },

    errorContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },

    errorText: {
      color: '#B00020',
      textAlign: 'center',
      marginBottom: 10,
    },

    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    retryButtonText: {
      color: colors.white,
      fontWeight: '700',
    },
  });
