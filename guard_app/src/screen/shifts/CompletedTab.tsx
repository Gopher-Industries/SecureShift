import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getUserAttendance } from '../../api/attendance';
import { getMe } from '../../api/auth';
import { myShifts, rateShift } from '../../api/shifts';
import CalendarView from '../../components/calendar/CalendarView';
import ShiftCard from '../../components/card/ShiftCard';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import ShiftDetailsModal from '../../components/modal/ShiftDetailsModal';
import ViewToggle from '../../components/toggle/ViewToggle';
import { useAppTheme } from '../../theme';
import { mapCompleted } from '../../utils/shiftMappers';
import { getStyles } from '../ShiftsScreen.styles';

import type { CompletedShift } from '../../models/Shifts';

type Props = {
  navigation: any;
};

export default function CompletedTab({ navigation }: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CompletedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [compPage, setCompPage] = useState(1);
  const [compPages, setCompPages] = useState(1);

  const fetchData = useCallback(async (pg: number) => {
    try {
      setLoading(true);
      const me = await getMe();
      const myUid = me?._id ?? me?.id;

      const [resp, attendanceRecords] = await Promise.all([
        myShifts({ page: pg, status: 'past' }),
        myUid ? getUserAttendance(myUid) : Promise.resolve([]),
      ]);

      setCompPage(resp.page);
      setCompPages(Math.ceil(resp.total / resp.limit));
      setRows(mapCompleted(resp.items, attendanceRecords));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(compPage), [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(compPage);
    setRefreshing(false);
  };

  const nextPage = async () => {
    setRefreshing(true);
    if (compPage < compPages) {
      fetchData(compPage + 1);
    }
    setRefreshing(false);
  };

  const prevPage = async () => {
    setRefreshing(true);
    if (compPage > 1) {
      fetchData(compPage - 1);
    }
    setRefreshing(false);
  };

  const filtered = rows.filter((r) =>
    `${r.title}${r.company}${r.site}`.toLowerCase().includes(q.toLowerCase()),
  );

  // send the rating, then update the row so the stars stay after closing the modal
  const handleRate = async (rating: number) => {
    if (!selectedShift) return;

    await rateShift(selectedShift.id, rating);

    setRows((prev) =>
      prev.map((row) => (row.id === selectedShift.id ? { ...row, rated: true, rating } : row)),
    );
    setSelectedShift((prev) => (prev ? { ...prev, rated: true, rating } : prev));
  };

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
          shifts={filtered.map((c) => ({ ...c, status: 'Completed' as const }))}
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

      {compPages > 1 && (
        <View style={s.pageButtonsView}>
          {compPage > 1 && (
            <TouchableOpacity style={s.pageButton} onPress={prevPage}>
              <Text style={s.pageButtonText}>&lt;</Text>
            </TouchableOpacity>
          )}

          {compPage < compPages && (
            <TouchableOpacity style={s.pageButton} onPress={nextPage}>
              <Text style={s.pageButtonText}>&gt;</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ShiftDetailsModal
        shift={selectedShift}
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        colors={colors}
        onRate={handleRate}
      />
    </View>
  );
}
