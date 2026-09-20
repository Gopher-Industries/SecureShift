import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMe } from '../../api/auth';
import { applyToShift, listShifts } from '../../api/shifts';
import CalendarView from '../../components/calendar/CalendarView';
import ShiftCard from '../../components/card/ShiftCard';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import ShiftAcknowledgementModal from '../../components/modal/ShiftAcknowledgementModal';
import ShiftDetailsModal from '../../components/modal/ShiftDetailsModal';
import ViewToggle from '../../components/toggle/ViewToggle';
import { saveShiftAcknowledgement } from '../../lib/shiftAcknowledgementStore';
import { useAppTheme } from '../../theme';
import {
  filterAndSortAllShifts,
  type DateFilter,
  type SortOption,
  type StatusFilter,
} from '../../utils/shiftFilters';
import { mapAllShifts } from '../../utils/shiftMappers';
import { getRecommendedShifts } from '../../utils/shiftRecommendations';
import { getStyles } from '../ShiftsScreen.styles';

import type { AllShift } from '../../models/Shifts';

type Props = {
  navigation: any;
};

export default function AllTab({ navigation }: Props) {
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
  const [acknowledgementShift, setAcknowledgementShift] = useState<AllShift | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('dateAsc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
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

  const submitApplication = async (shiftId: string, signature?: string) => {
    try {
      setApplyingId(shiftId);

      await applyToShift(shiftId);
      const shift = rows.find((item) => item.id === shiftId);

      if (shift) {
        await saveShiftAcknowledgement({
          id: `${shiftId}-${Date.now()}`,
          shiftId,
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          instructionsSnapshot: shift.detailedInstructions?.trim() ?? '',
          signature,
        });
      }

      setAcknowledgementShift(null);
      setSelectedShift(null);

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
    const shift = rows.find((item) => item.id === shiftId);

    if (!shift) {
      Alert.alert('Error', 'Shift details could not be loaded.');
      return;
    }

    setAcknowledgementShift(shift);
  };

  const filtered = filterAndSortAllShifts(rows, { q, statusFilter, dateFilter, sortOption });
  const recommended = getRecommendedShifts(rows);

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
            onPress={() => setDateFilter(option.value as DateFilter)}
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
            onPress={() => setSortOption(option.value as SortOption)}
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
          ListHeaderComponent={
            <>
              {recommended.length > 0 && (
                <View style={s.recommendedSection}>
                  <Text style={s.recommendedTitle}>Recommended for you</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.recommendedRow}
                  >
                    {recommended.map((shift) => (
                      <View key={shift.id} style={s.recommendedCard}>
                        <ShiftCard
                          shift={shift}
                          onPress={() => setSelectedShift(shift)}
                          colors={colors}
                          showApply
                          onApply={() => handleApply(shift.id)}
                          applying={applyingId === shift.id}
                        />

                        <Text style={s.recommendationReason}>{shift.recommendationReason}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={s.allShiftsTitle}>All shifts</Text>
            </>
          }
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
      <ShiftAcknowledgementModal
        visible={acknowledgementShift !== null}
        shift={acknowledgementShift}
        colors={colors}
        applying={acknowledgementShift ? applyingId === acknowledgementShift.id : false}
        onClose={() => setAcknowledgementShift(null)}
        onConfirm={(signature) => {
          if (acknowledgementShift) {
            void submitApplication(acknowledgementShift.id, signature);
          }
        }}
      />
    </View>
  );
}
