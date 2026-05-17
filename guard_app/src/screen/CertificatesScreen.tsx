/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, TouchableOpacity, StyleSheet } from 'react-native';

import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

type DocItem = {
  id: string;
  name: string;
  uploadedAt: string;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDMY = (d?: Date) => {
  if (!d) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function computeStatus(expiry?: Date) {
  if (!expiry) return 'Valid';
  const today = startOfDay(new Date());
  const exp = startOfDay(expiry);

  if (exp < today) return 'Expired';

  const msDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / msDay);

  if (daysLeft <= 30) return 'Expiring';
  return 'Valid';
}

function getStatusStyles(status: string, colors: AppColors) {
  if (status === 'Expired') {
    return {
      borderColor: colors.status.rejected,
      backgroundColor: colors.card,
      textColor: colors.status.rejected,
    };
  }

  if (status === 'Expiring') {
    return {
      borderColor: colors.status.pending,
      backgroundColor: colors.card,
      textColor: colors.status.pending,
    };
  }

  return {
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    textColor: colors.text,
  };
}

export default function CertificatesScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const docs: DocItem[] = useMemo(
    () => [
      { id: '1', name: 'Security License', uploadedAt: '20/01/2026' },
      { id: '2', name: 'CPR', uploadedAt: '18/01/2026' },
      { id: '3', name: 'First Aid', uploadedAt: '10/01/2026' },
    ],
    [],
  );

  const [expiryDates, setExpiryDates] = useState<Record<string, Date | undefined>>({});
  const [pickerDocId, setPickerDocId] = useState<string | null>(null);
  const [warningDocId, setWarningDocId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const makeNextDates = (days = 365) => {
    const arr: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d);
    }
    return arr;
  };

  const dateOptions = useMemo(() => makeNextDates(365), []);

  const renderItem = ({ item }: { item: DocItem }) => {
    const expiry = expiryDates[item.id];
    const status = computeStatus(expiry);
    const statusStyle = getStatusStyles(status, colors);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusStyle.borderColor,
                backgroundColor: statusStyle.backgroundColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaText}>Upload date: {item.uploadedAt}</Text>
          <Text style={styles.metaText}>Expiry date: {formatDMY(expiry)}</Text>
        </View>

        <Pressable
          onPress={() => {
            setPickerDocId(item.id);
            setWarningDocId(null);
            setIsPickerOpen(true);
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Set Expiry Date</Text>
        </Pressable>

        {warningDocId === item.id ? (
          <Text style={styles.warningText}>Expiry date cannot be before today.</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Certificates</Text>

      {docs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No documents</Text>
          <Text style={styles.emptyText}>
            Upload a document to see it listed here with expiry details.
          </Text>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={isPickerOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Expiry Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsPickerOpen(false);
                  setPickerDocId(null);
                }}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={dateOptions}
              keyExtractor={(d) => d.toISOString()}
              renderItem={({ item: d }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (!pickerDocId) return;
                    setExpiryDates((prev) => ({ ...prev, [pickerDocId]: d }));
                    setWarningDocId(null);
                    setIsPickerOpen(false);
                    setPickerDocId(null);
                  }}
                  style={styles.dateOption}
                >
                  <Text style={styles.dateOptionText}>{formatDMY(d)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.bg,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 12,
      color: colors.text,
    },
    listContent: {
      paddingBottom: 12,
    },
    card: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    metaBlock: {
      marginTop: 8,
    },
    metaText: {
      color: colors.muted,
      marginBottom: 2,
    },
    actionButton: {
      marginTop: 10,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
    },
    actionButtonText: {
      fontWeight: '700',
      color: colors.text,
    },
    warningText: {
      marginTop: 8,
      color: colors.status.rejected,
      fontSize: 12,
    },
    emptyCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    emptyTitle: {
      fontWeight: '800',
      color: colors.text,
    },
    emptyText: {
      marginTop: 6,
      color: colors.muted,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    modalSheet: {
      backgroundColor: colors.card,
      padding: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '60%',
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    closeText: {
      fontWeight: '800',
      color: colors.primary,
    },
    dateOption: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateOptionText: {
      color: colors.text,
    },
  });
