import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getUserAttendance } from '../../api/attendance';
import { getMe } from '../../api/auth';
import { myShifts } from '../../api/shifts';
import CalendarView from '../../components/calendar/CalendarView';
import ShiftCard from '../../components/card/ShiftCard';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import ShiftDetailsModal from '../../components/modal/ShiftDetailsModal';
import ViewToggle from '../../components/toggle/ViewToggle';
import { useAppTheme } from '../../theme';
import { mapMineShifts } from '../../utils/shiftMappers';
import { getStyles } from '../ShiftsScreen.styles';

import type { AppliedShift } from '../../models/Shifts';

type Props = {
  navigation: any;
};

export default function AppliedTab({ navigation }: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AppliedShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState<AppliedShift | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (pg: number) => {
    try {
      setLoading(true);
      const me = await getMe();
      const myUid = me?._id ?? me?.id;
      if (!myUid) {
        setRows([]);
        return;
      }
      const [mine, attendanceRecords] = await Promise.all([
        myShifts({ page: pg }),
        getUserAttendance(myUid),
      ]);

      setPage(mine.page);
      setPages(Math.ceil(mine.total / mine.limit));
      setRows(mapMineShifts(mine.items, myUid, attendanceRecords));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(1), [fetchData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(1);
    setRefreshing(false);
  };

  const nextPage = async () => {
    setRefreshing(true);
    if (page < pages) {
      fetchData(page + 1);
    }
    setRefreshing(false);
  };

  const prevPage = async () => {
    setRefreshing(true);
    if (page > 1) {
      fetchData(page - 1);
    }
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
        <>
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ShiftCard shift={item} onPress={() => setSelectedShift(item)} colors={colors} />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState icon="briefcase-outline" title={t('shifts.noShifts')} />
            }
          />
        </>
      )}

      {pages > 1 && (
        <View style={s.pageButtonsView}>
          {page > 1 && (
            <TouchableOpacity style={s.pageButton} onPress={prevPage}>
              <Text style={s.pageButtonText}>&lt;</Text>
            </TouchableOpacity>
          )}

          {page < pages && (
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
      />
    </View>
  );
}
