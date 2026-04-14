// src/screen/TimesheetsScreen.tsx
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AxiosError } from 'axios';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { getMyAttendance, type Attendance } from '../api/attendance';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

function safeDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtDateTime(d?: string | null) {
  const dt = safeDate(d);
  if (!dt) return '—';
  return dt.toLocaleString();
}

function fmtShiftLabel(att: Attendance) {
  const s = att.shiftId;

  if (s && typeof s === 'object') {
    const title = s.title ?? 'Shift';
    const date = s.date ? new Date(s.date).toDateString() : '';
    const time = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : '';
    return [title, date, time].filter(Boolean).join(' • ');
  }

  return `Shift ID: ${String(att.shiftId)}`;
}

export default function TimesheetsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Attendance[]>([]);

  const load = async () => {
    try {
      const rows = await getMyAttendance();
      setItems(rows);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load timesheets';
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', 'Failed to load timesheets');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const renderItem = ({ item }: { item: Attendance }) => {
    const checkedIn = !!item.checkInTime;
    const checkedOut = !!item.checkOutTime;

    const hours =
      item.checkInTime && item.checkOutTime
        ? (
            (new Date(item.checkOutTime).getTime() - new Date(item.checkInTime).getTime()) /
            (1000 * 60 * 60)
          ).toFixed(1) + ' hrs'
        : '—';

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ShiftDetails', { shiftId: item.shiftId })}
      >
        <Text style={s.title}>{fmtShiftLabel(item)}</Text>

        <View style={s.row}>
          <Text style={s.label}>Check In:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkInTime)}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Check Out:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkOutTime)}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Hours:</Text>
          <Text style={s.value}>{hours}</Text>
        </View>

        <View style={s.rowBetween}>
          <Text style={s.meta}>
            Status:{' '}
            <Text style={checkedIn ? s.ok : s.muted}>
              {checkedOut ? 'Completed' : checkedIn ? 'In progress' : 'Not started'}
            </Text>
          </Text>

          <View style={[s.badge, item.locationVerified ? s.badgeOk : s.badgeWarn]}>
            <Text style={[s.badgeText, item.locationVerified ? s.badgeTextOk : s.badgeTextWarn]}>
              {item.locationVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Loading timesheets...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>No timesheet records yet.</Text>}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      marginTop: 10,
      color: colors.muted,
    },

    empty: {
      textAlign: 'center',
      marginTop: 30,
      color: colors.muted,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
    },

    row: {
      flexDirection: 'row',
      marginBottom: 6,
    },

    label: {
      width: 85,
      fontWeight: '700',
      color: colors.text,
    },

    value: {
      flex: 1,
      color: colors.muted,
    },

    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    meta: {
      marginTop: 8,
      color: colors.text,
      fontWeight: '700',
    },

    ok: {
      color: colors.status.confirmed,
      fontWeight: '800',
    },

    muted: {
      color: colors.muted,
      fontWeight: '800',
    },

    badge: {
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    badgeOk: {
      backgroundColor: colors.greenSoft,
    },

    badgeWarn: {
      backgroundColor: colors.primarySoft,
    },

    badgeText: {
      fontWeight: '800',
      fontSize: 12,
    },

    badgeTextOk: {
      color: colors.status.confirmed,
    },

    badgeTextWarn: {
      color: colors.link,
    },
  });
