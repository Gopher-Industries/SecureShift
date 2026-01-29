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

import { applyToShift, listShifts, type ShiftDto } from '../api/shifts';
import { COLORS } from '../theme/colors';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// If you have a central RootStackParamList in AppNavigator, use it instead.
// Otherwise this local type works for navigation typing.
type RootStackParamList = {
  ShiftDetails: { shift: ShiftDto; refresh?: () => void };
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ShiftsScreen() {
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ShiftDto[]>([]);

  const fetchShifts = async () => {
    try {
      const res = await listShifts(1, 50);
      setItems(res.items ?? []);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load shifts';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchShifts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShifts();
  };

  const onApply = async (shiftId: string) => {
    try {
      const res = await applyToShift(shiftId);
      Alert.alert('Applied', res?.message ?? 'Applied successfully ✅');
      await fetchShifts();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to apply';
      Alert.alert('Error', msg);
    }
  };

  const renderItem = ({ item }: { item: ShiftDto }) => {
    const status = item.status ?? 'open';

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() =>
          navigation.navigate('ShiftDetails', {
            shift: item,
            refresh: fetchShifts,
          })
        }
      >
        <View style={s.rowBetween}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.badge}>{status.toUpperCase()}</Text>
        </View>

        <Text style={s.subText}>{item.createdBy?.company ?? 'Company N/A'}</Text>
        <Text style={s.subText}>
          {item.date} • {item.startTime} - {item.endTime}
        </Text>

        <View style={s.rowBetween}>
          <Text style={s.pay}>${item.payRate ?? 0}/hr</Text>

          {status === 'open' ? (
            <TouchableOpacity style={s.applyBtn} onPress={() => onApply(item._id)}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.dimText}>
              {status === 'applied'
                ? 'Applied'
                : status === 'assigned'
                  ? 'Assigned'
                  : status === 'completed'
                    ? 'Completed'
                    : status}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Loading shifts...</Text>
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
        ListEmptyComponent={<Text style={s.empty}>No shifts found.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted },

  empty: { textAlign: 'center', marginTop: 30, color: COLORS.muted },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1, paddingRight: 10 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  subText: { color: COLORS.muted, marginTop: 4 },
  pay: { fontWeight: '700', color: COLORS.text, marginTop: 12 },

  applyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  applyBtnText: { color: '#fff', fontWeight: '700' },
  dimText: { marginTop: 12, color: COLORS.muted, fontWeight: '600' },
});
