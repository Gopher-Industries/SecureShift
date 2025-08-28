import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@guard_profile_v1';

export default function ProfileScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    license: 'LIC-NSW-123456',
    stats: { totalShifts: 140, rating: 4.9, attendancePct: 98 },
    contact: { email: 'alex.johnson@gmail.com', phone: '+61 123456789' },
    certifications: ['Security License', 'CPR', 'First Aid'],
  });

  // ----- Load & Save (Persistence) -----
  const loadProfile = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const saveProfile = useCallback(async (p) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    // Save on any change
    saveProfile(profile);
  }, [profile, saveProfile]);

  // ----- Pull to refresh (mock) -----
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // simulate fetching latest stats
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          // keep same values (design unchanged) but in real app you’d update from API
          totalShifts: prev.stats.totalShifts,
          rating: prev.stats.rating,
          attendancePct: prev.stats.attendancePct,
        },
      }));
      setRefreshing(false);
    }, 800);
  }, []);

  // ----- Edit Contact Modal -----
  const [showEdit, setShowEdit] = useState(false);
  const [draftEmail, setDraftEmail] = useState(profile.contact.email);
  const [draftPhone, setDraftPhone] = useState(profile.contact.phone);

  const openEdit = () => {
    setDraftEmail(profile.contact.email);
    setDraftPhone(profile.contact.phone);
    setShowEdit(true);
  };

  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const validatePhone = (p: string) =>
    /^\+?\d[\d\s\-]{6,}$/.test(p.trim());

  const saveContact = () => {
    if (!validateEmail(draftEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!validatePhone(draftPhone)) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    setProfile((prev) => ({
      ...prev,
      contact: { email: draftEmail.trim(), phone: draftPhone.trim() },
    }));
    setShowEdit(false);
  };

  // ----- Add Certification Modal -----
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState('');

  const addCertification = () => {
    const c = newCert.trim();
    if (!c) {
      Alert.alert('Empty value', 'Please enter a certification name.');
      return;
    }
    if (profile.certifications.some((x) => x.toLowerCase() === c.toLowerCase())) {
      Alert.alert('Duplicate', 'This certification already exists.');
      return;
    }
    setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, c] }));
    setNewCert('');
    setShowAddCert(false);
  };

  const removeCertification = (cert: string) => {
    Alert.alert('Remove certification', `Remove "${cert}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setProfile((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((c) => c !== cert),
          })),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
        </View>

        {/* Name */}
        <Text style={styles.name}>{profile.name}</Text>

        {/* Performance Summary (UI unchanged) */}
        <View style={[styles.card, styles.performanceCard]}>
          <Text style={styles.cardTitle}>
            <Text style={styles.icon}>⭐</Text>  Performance Summary
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>
                {profile.stats.totalShifts}
              </Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#facc15' }]}>
                {profile.stats.rating.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: 'green' }]}>
                {profile.stats.attendancePct}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Contact Info (added small edit button, same card layout) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <TouchableOpacity onPress={openEdit} accessibilityRole="button">
              <Ionicons name="create-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>Email: {profile.contact.email}</Text>
          <Text style={[styles.infoText, { marginTop: 6 }]}>
            Phone: {profile.contact.phone}
          </Text>
        </View>

        {/* Certifications (add via small plus, remove on long-press) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Certifications</Text>
            <TouchableOpacity onPress={() => setShowAddCert(true)} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={22} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <View style={styles.badgesRow}>
            {profile.certifications.map((badge, idx) => (
              <TouchableOpacity
                key={`${badge}-${idx}`}
                onLongPress={() => removeCertification(badge)}
                delayLongPress={300}
                activeOpacity={0.7}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Contact Modal */}
      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Contact</Text>
            <TextInput
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setShowEdit(false)}>
                <Text style={styles.btnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveContact}>
                <Text style={styles.btnTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Certification Modal */}
      <Modal visible={showAddCert} transparent animationType="fade" onRequestClose={() => setShowAddCert(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Certification</Text>
            <TextInput
              value={newCert}
              onChangeText={setNewCert}
              placeholder="e.g., RSA, White Card"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setShowAddCert(false)}>
                <Text style={styles.btnTextSecondary}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={addCertification}>
                <Text style={styles.btnTextPrimary}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----- Styles (kept same look & palette) -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#1E3A8A',
    height: 100,
    width: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  performanceCard: {
    backgroundColor: '#EEF2FF',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#1E3A8A',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnPrimary: { backgroundColor: '#1E3A8A' },
  btnSecondary: { backgroundColor: '#eef2ff' },
  btnTextPrimary: { color: '#fff', fontWeight: '600' },
  btnTextSecondary: { color: '#1E3A8A', fontWeight: '600' },
});
