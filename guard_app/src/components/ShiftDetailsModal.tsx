import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// types + component
export interface ShiftDetailsModalProps {
  visible: boolean;
  shift: any;
  onClose: () => void;
}

export default function ShiftDetailsModal({
  visible,
  shift,
  onClose,
}: ShiftDetailsModalProps) {
  if (!shift) return null;

  const statusColor =
    shift.status === 'Confirmed'
      ? '#22c55e'
      : shift.status === 'Pending'
      ? '#3b82f6'
      : '#9ca3af';


  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[styles.statusPill, { backgroundColor: statusColor }]}
          />

          <Text style={styles.title}>
            {shift.title ?? 'Shift Details'}
          </Text>

          <Text style={styles.text}>
            {shift.date} · {shift.time}
          </Text>


          {shift.site && (
            <Text style={styles.text}>{shift.site}</Text>
          )}

          {shift.rate && (
            <Text style={styles.text}>{shift.rate}</Text>
          )}


          <Text style={styles.status}>
            Status: {shift.status}
          </Text>

          <View style={styles.buttonsRow}>
            {shift.status === 'applied' && (
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  Cancel Application
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// styles
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  statusPill: {
    height: 6,
    width: 48,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    marginBottom: 4,
  },
  status: {
    marginTop: 8,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#003f88',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});
