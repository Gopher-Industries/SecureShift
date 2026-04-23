// src/screen/PayrollScreen.tsx

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getMe } from '../api/auth';
import PayrollFilterModal from '../components/PayrollFilterModal';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

interface Payroll {
  startDate: Date;
  endDate: Date;
  periodType: 'daily' | 'weekly' | 'monthly';
  guardId?: string;
  site?: string;
  department?: string;
}

export default function PayrollScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [rows, setRows] = useState<Payroll[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMe();
      const myUid = me?._id ?? me?.id ?? '';

      //const resp = await getPayrollData();
      //const mapped = mapPayroll(resp.items);
      // THE FOLLOWING IS DUMMY DATA
      const pay1: Payroll = { startDate: new Date(), endDate: new Date(), periodType: 'daily' };
      const pay2: Payroll = {
        startDate: new Date(),
        endDate: new Date(),
        periodType: 'weekly',
        guardId: '123',
        site: 'Home',
        department: 'Accounting',
      };
      const pay11: Payroll = { startDate: new Date(), endDate: new Date(), periodType: 'daily' };
      const pay21: Payroll = {
        startDate: new Date(),
        endDate: new Date(),
        periodType: 'weekly',
        guardId: '456',
        site: 'Home',
        department: 'Accounting',
      };
      const pay111: Payroll = { startDate: new Date(), endDate: new Date(), periodType: 'daily' };
      const pay211: Payroll = {
        startDate: new Date(),
        endDate: new Date(),
        periodType: 'weekly',
        guardId: '129042',
        site: 'Place',
        department: 'Firm',
      };
      const pay122: Payroll = { startDate: new Date(), endDate: new Date(), periodType: 'daily' };
      const pay222: Payroll = {
        startDate: new Date(),
        endDate: new Date(),
        periodType: 'monthly',
        guardId: '98415',
        site: 'Home',
        department: 'Accounting',
      };
      const pay12: Payroll = { startDate: new Date(), endDate: new Date(), periodType: 'daily' };
      const pay22: Payroll = {
        startDate: new Date('2025-12-12'),
        endDate: new Date(),
        periodType: 'weekly',
        guardId: '129042',
        site: 'Home',
        department: 'Accounting',
      };
      const pay223: Payroll = {
        startDate: new Date('2025-12-12'),
        endDate: new Date('2025-12-12'),
        periodType: 'weekly',
        guardId: '129042',
        site: 'Home',
        department: 'Accounting',
      };

      const mapped = [
        pay1,
        pay2,
        pay11,
        pay111,
        pay12,
        pay122,
        pay21,
        pay211,
        pay22,
        pay222,
        pay223,
      ];
      setRows(mapped);
      setError('');
    } catch (e) {
      console.error(e);
      setError(t('payroll.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const handleAddFilter = (
    start: Date,
    end: Date,
    period: string,
    id?: string,
    site?: string,
    department?: string,
  ) => {
    let mapped = rows;

    //Frustratingly the least intensive way I can manage to make this work
    if (id != null && id != '') {
      if (site != null && site != '') {
        if (department != null && department != '') {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.guardId === id &&
              row.site === site &&
              row.department === department
            );
          });
        } else {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.guardId === id
            );
          });
        }
      } else {
        if (department != null && department != '') {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.guardId === id &&
              row.department === department
            );
          });
        } else {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.guardId === id
            );
          });
        }
      }
    } else {
      if (site != null && site != '') {
        if (department != null && department != '') {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.site === site &&
              row.department === department
            );
          });
        } else {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString()
            );
          });
        }
      } else {
        if (department != null && department != '') {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString() &&
              row.department === department
            );
          });
        } else {
          mapped = rows.filter(function (row) {
            return (
              row.periodType === period &&
              row.startDate.toDateString() === start.toDateString() &&
              row.endDate.toDateString() === end.toDateString()
            );
          });
        }
      }
    }

    setRows(mapped);
  };

  return (
    <View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="filter-outline" size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => fetchData()}>
          <Ionicons name="close-circle-outline" size={22} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!error && !loading && (
        <View style={styles.mainView}>
          <FlatList
            data={rows}
            contentContainerStyle={styles.payList}
            renderItem={({ item }) => (
              <View style={styles.payCard}>
                <Text style={{ fontSize: 18 }}>
                  {item.startDate.toDateString()} - {item.endDate.toDateString()}
                </Text>
                <View style={styles.payRow}>
                  <Text style={styles.payMeta}>
                    {t('payroll.period')} {item.periodType}
                  </Text>
                  <Text style={styles.payMetaDot}>•</Text>
                  <Text style={styles.payMeta}>
                    {t('payroll.guardID')} {item.guardId ?? 'Not found'}
                  </Text>
                </View>
                <View style={styles.payRow}>
                  <Text style={styles.payMeta}>
                    {t('payroll.site')} {item.site ?? 'Not found'}
                  </Text>
                  <Text style={styles.payMetaDot}>•</Text>
                  <Text style={styles.payMeta}>
                    {t('payroll.department')} {item.department ?? 'Not found'}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('payroll.notFound')}</Text>}
          />

          <PayrollFilterModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onFilter={handleAddFilter}
          />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scroll: {
      padding: 16,
    },
    filterBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterRow: {
      flexDirection: 'row-reverse',
      paddingHorizontal: 30,
      paddingTop: 10,
      marginBottom: 10,
    },
    mainView: {
      paddingBottom: 95,
    },
    payList: {
      paddingBottom: 95,
    },
    payCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 10,
      marginVertical: 5,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    payRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    payHead: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    payMeta: {
      fontSize: 13,
      color: colors.muted,
    },
    payMetaDot: {
      fontSize: 13,
      color: colors.muted,
      marginHorizontal: 6,
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
  });
