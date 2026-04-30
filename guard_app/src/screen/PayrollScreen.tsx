// src/screen/PayrollScreen.tsx

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getPayroll, type PayrollResponse, PayrollPeriodType } from '../api/payroll';
import PayrollFilterModal from '../components/PayrollFilterModal';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

export default function PayrollScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [rows, setRows] = useState<PayrollResponse>();

  const fetchData = useCallback(async () => {
    try {
      setModalVisible(true);
      setError('');
    } catch (e) {
      console.error(e);
      setError(t('payroll.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const handleAddFilter = async (
    start: Date,
    end: Date,
    period: PayrollPeriodType,
    id?: string,
    department?: string,
  ) => {
    console.log(start);
    setLoading(true);
    try {
      const mapped = await getPayroll({
        startDate: start.toDateString(),
        endDate: end.toDateString(),
        periodType: period,
        guardId: id,
        department: department,
      });
      setRows(mapped);
      setError('');
    } catch (e) {
      console.log(e);
      setError(t('payroll.error'));
    } finally {
      setLoading(false);
    }
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
            data={rows?.records}
            contentContainerStyle={styles.payList}
            renderItem={({ item }) => (
              <View style={styles.payCard}>
                <Text style={styles.periodCard}>
                  {item.period.endDate} - {item.period.endDate}
                </Text>
                <View style={styles.payRow}>
                  <Text style={styles.payMeta}>
                    {t('payroll.period')} {item.period.type}
                  </Text>
                  <Text style={styles.payMetaDot}>•</Text>
                  <Text style={styles.payMeta}>
                    {t('payroll.guardID')} {item.guard ?? 'Not found'}
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
    periodCard: {
      fontSize: 18,
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
