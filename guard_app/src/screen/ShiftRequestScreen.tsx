import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getMe } from '../api/auth';
import { listShiftRequests, ShiftRequestDto } from '../api/shiftRequest';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

export default function ShiftRequestScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [allRows, setAllRows] = useState<ShiftRequestDto[]>([]);
  const [rows, setRows] = useState<ShiftRequestDto[]>([]);

  const STATUS_TYPES = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: t('shifts.pending') },
    { id: 'APPROVED', label: t('shifts.approved') },
    { id: 'REJECTED', label: t('shifts.rejected') },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await listShiftRequests();

      if (!res.success) throw error;

      setAllRows(res.items);
      setRows(allRows);
      setError('');
    } catch (e: unknown) {
      setError(t('shifts.requestError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const handleFilter = (filter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    if (filter == 'PENDING') {
      setFilter('PENDING');
      setRows(allRows.filter((row) => row.status == 'PENDING'));
    } else if (filter == 'APPROVED') {
      setFilter('APPROVED');
      setRows(allRows.filter((row) => row.status == 'APPROVED'));
    } else if (filter == 'REJECTED') {
      setFilter('REJECTED');
      setRows(allRows.filter((row) => row.status == 'REJECTED'));
    } else {
      setFilter('ALL');
      setRows(allRows);
    }
  };

  function getStatusColor(status: string): string {
    if (status === 'PENDING') return colors.status.pending;
    else if (status === 'APPROVED') return colors.status.confirmed;
    return colors.status.rejected;
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
        <Ionicons name="filter-outline" size={22} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDropdown && (
        <View style={styles.dropdownMenu}>
          {STATUS_TYPES.map((status) => (
            <TouchableOpacity
              key={status.id}
              style={[styles.dropdownItem, filter === status.id && styles.dropdownItemSelected]}
              onPress={() => {
                if (
                  status.id == 'ALL' ||
                  status.id == 'PENDING' ||
                  status.id == 'APPROVED' ||
                  status.id == 'REJECTED'
                ) {
                  handleFilter(status.id);
                }
                setShowDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  filter === status.id && styles.dropdownItemTextSelected,
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!error && !loading && (
        <FlatList
          data={rows}
          contentContainerStyle={styles.cardList}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleSection}>
                  <Text style={styles.cardTitle}>{item._id}</Text>
                  <View
                    style={[
                      styles.cardStatusBadge,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    <Text style={styles.cardStatusText}>
                      {item.status === 'PENDING'
                        ? t('shifts.pending')
                        : item.status === 'APPROVED'
                          ? t('shifts.approved')
                          : t('shifts.rejected')}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardReason}>{item.reason ?? '---'}</Text>

              {item.rejectionReason != null && item.rejectionReason != '' && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardRejection}>{t('shifts.rejected')} </Text>
                  <Text style={styles.cardValue}>{item.rejectionReason}</Text>
                </View>
              )}

              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>{t('shifts.requestType')}</Text>
                <Text style={styles.cardValue}>
                  {item.type === 'LEAVE' ? t('shifts.leave') : t('shifts.swap')}
                </Text>
              </View>

              {item.type === 'LEAVE' && (
                <View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>{t('shifts.leaveStart')}</Text>
                    <Text style={styles.cardValue}>
                      {typeof item.createdAt === 'string'
                        ? new Date(Date.parse(item.createdAt)).toDateString()
                        : '---'}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>{t('shifts.leaveEnd')}</Text>
                    <Text style={styles.cardValue}>
                      {typeof item.createdAt === 'string'
                        ? new Date(Date.parse(item.createdAt)).toDateString()
                        : '---'}
                    </Text>
                  </View>
                </View>
              )}

              {item.type === 'SWAP' && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>{t('shifts.requestedDate')}</Text>
                  <Text style={styles.cardValue}>
                    {typeof item.createdAt === 'string'
                      ? new Date(Date.parse(item.createdAt)).toDateString()
                      : '---'}
                  </Text>
                </View>
              )}

              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>{t('shifts.requestedDate')}</Text>
                <Text style={styles.cardValue}>
                  {typeof item.createdAt === 'string'
                    ? new Date(Date.parse(item.createdAt)).toDateString()
                    : '---'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('shifts.notFound')}</Text>}
        />
      )}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      paddingHorizontal: 30,
      paddingTop: 10,
      marginBottom: 10,
    },
    requestsTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    emptyText: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 40,
      fontSize: 24,
      fontWeight: 600,
    },
    errorText: {
      textAlign: 'center',
      color: colors.status.rejected,
      marginTop: 40,
      fontSize: 24,
      fontWeight: 600,
    },
    cardList: {
      paddingBottom: 95,
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
      marginLeft: 12,
    },
    cardStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.white,
    },
    cardReason: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 12,
    },
    cardRejection: {
      fontSize: 13,
      color: colors.status.rejected,
      fontWeight: 600,
      width: 65,
      marginBottom: 6,
    },
    cardRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    cardLabel: {
      fontSize: 13,
      color: colors.muted,
      width: 90,
    },
    cardValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    dropdown: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
    },
    dropdownMenu: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      maxHeight: 340,
    },
    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
