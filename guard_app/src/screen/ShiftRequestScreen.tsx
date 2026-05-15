import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

interface ShiftRequest {
  id: string;
  type: 'SWAP' | 'LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  reason?: string;
}

export default function ShiftRequestScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [allRows, setAllRows] = useState<ShiftRequest[]>([]);
  const [rows, setRows] = useState<ShiftRequest[]>([]);

  const STATUS_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: t('shifts.pending') },
    { id: 'approved', label: t('shifts.approved') },
    { id: 'rejected', label: t('shifts.rejected') },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      //DUMMY DATA
      const row1: ShiftRequest = {
        id: 'id',
        type: 'SWAP',
        status: 'PENDING',
        created_at: new Date().toDateString(),
        reason: 'The reason is I really want a day off',
      };
      const row2: ShiftRequest = {
        id: 'id2',
        type: 'LEAVE',
        status: 'APPROVED',
        created_at: new Date().toDateString(),
        reason: 'The reason is I am testing stuff',
      };
      const row3: ShiftRequest = {
        id: 'id3',
        type: 'SWAP',
        status: 'REJECTED',
        created_at: new Date().toDateString(),
      };
      const row4: ShiftRequest = {
        id: 'id4',
        type: 'LEAVE',
        status: 'PENDING',
        created_at: new Date().toDateString(),
        reason: 'The reason is I really want a day off',
      };
      const row5: ShiftRequest = {
        id: 'id5',
        type: 'SWAP',
        status: 'APPROVED',
        created_at: new Date().toDateString(),
        reason: 'The reason is I am testing stuff',
      };
      const row6: ShiftRequest = {
        id: 'id6',
        type: 'LEAVE',
        status: 'REJECTED',
        created_at: new Date().toDateString(),
      };

      setAllRows([row1, row2, row3, row4, row5, row6]);
      setRows(allRows);
      setError('');
    } catch (e: unknown) {
      setError(t('shifts.requestError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const handleFilter = (filter: 'all' | 'pending' | 'approved' | 'rejected') => {
    if (filter == 'pending') {
      setFilter('pending');
      setRows(allRows.filter((row) => row.status == 'PENDING'));
    } else if (filter == 'approved') {
      setFilter('approved');
      setRows(allRows.filter((row) => row.status == 'APPROVED'));
    } else if (filter == 'rejected') {
      setFilter('rejected');
      setRows(allRows.filter((row) => row.status == 'REJECTED'));
    } else {
      setFilter('all');
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
                  status.id == 'all' ||
                  status.id == 'pending' ||
                  status.id == 'approved' ||
                  status.id == 'rejected'
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
                  <Text style={styles.cardTitle}>{item.id}</Text>
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

              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>{t('shifts.requestType')}</Text>
                <Text style={styles.cardValue}>
                  {item.type === 'LEAVE' ? t('shifts.leave') : t('shifts.swap')}
                </Text>
              </View>

              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>{t('shifts.requestedDate')}</Text>
                <Text style={styles.cardValue}>{item.created_at}</Text>
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
