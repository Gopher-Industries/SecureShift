import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EquipmentItem, getAssignedEquipment, reportEquipmentFault } from '../api/equipment';
import { getUserProfile } from '../api/profile';
import { useAppTheme } from '../theme';

export default function EquipmentScreen() {
  const { colors } = useAppTheme();

  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getUserProfile();
      const guardId = profile?._id;

      if (!guardId) {
        throw new Error('Unable to load guard profile.');
      }

      const items = await getAssignedEquipment(guardId);
      setEquipment(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load equipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Assigned Equipment</Text>

        {loading && <ActivityIndicator size="large" color={colors.primary} />}

        {!loading && error && (
          <Text style={[styles.message, { color: colors.status.rejected }]}>{error}</Text>
        )}

        {!loading && !error && equipment.length === 0 && (
          <Text style={[styles.message, { color: colors.muted }]}>No equipment assigned.</Text>
        )}

        {!loading &&
          !error &&
          equipment.map((item) => (
            <View
              key={item._id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>

              <Text style={[styles.status, { color: colors.muted }]}>Status: {item.status}</Text>
              <TouchableOpacity
                style={[styles.reportButton, { backgroundColor: colors.primary }]}
                onPress={() =>
                  Alert.alert('Report Fault', `Update status for ${item.name}`, [
                    {
                      text: 'Damaged',
                      onPress: async () => {
                        try {
                          await reportEquipmentFault(item._id, 'DAMAGED');
                          await loadEquipment();

                          Alert.alert('Success', 'Equipment reported as damaged.');
                        } catch {
                          Alert.alert('Error', 'Failed to report equipment fault.');
                        }
                      },
                    },
                    {
                      text: 'Lost',
                      onPress: async () => {
                        try {
                          await reportEquipmentFault(item._id, 'LOST');
                          await loadEquipment();

                          Alert.alert('Success', 'Equipment reported as lost.');
                        } catch {
                          Alert.alert('Error', 'Failed to report equipment fault.');
                        }
                      },
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ])
                }
              >
                <Text style={styles.reportButtonText}>Report Fault</Text>
              </TouchableOpacity>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    marginTop: 8,
    fontSize: 14,
  },
  message: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  reportButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
