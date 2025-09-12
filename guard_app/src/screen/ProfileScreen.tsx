/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-native/no-inline-styles */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

import { getUserProfile } from '../api/profile';
import { LocalStorage } from '../lib/localStorage';
import { LicenseStatus } from '../models/License';
import { UserProfile } from '../models/UserProfile';

export default function ProfileScreen({ navigation, route }: any) {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleEditProfile = () => {
    // Pass current user profile data to EditProfileScreen
    navigation.navigate('EditProfile', { userProfile: data });
  };

  const loadProfileImage = async () => {
    try {
      const savedUri = await LocalStorage.getProfileImage();
      setProfileImage(savedUri);
    } catch (e) {
      setProfileImage(null);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getUserProfile();
      setData(profile);
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Init
  useEffect(() => {
    loadProfileData();
    loadProfileImage();
  }, []);

  // Handle refresh parameter from navigation to refresh data
  useEffect(() => {
    if (route?.params?.refresh) {
      loadProfileData();
      loadProfileImage();

      // Clear the refresh parameter to prevent infinite loops from navigation
      navigation.setParams({ refresh: false });
    }
  }, [navigation, route?.params?.refresh]);

  // Helper functions for license status styling
  const getStatusBadgeStyle = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.VERIFIED:
        return { backgroundColor: '#D1FAE5', borderColor: '#10B981' };
      case LicenseStatus.PENDING:
        return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case LicenseStatus.REJECTED:
        return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
      default:
        return { backgroundColor: '#F3F4F6', borderColor: '#6B7280' };
    }
  };

  const getStatusTextStyle = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.VERIFIED:
        return { color: '#065F46' };
      case LicenseStatus.PENDING:
        return { color: '#92400E' };
      case LicenseStatus.REJECTED:
        return { color: '#991B1B' };
      default:
        return { color: '#374151' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
        </View>

        {/* Name */}
        <View style={styles.nameContainer}>
          {loading || error ? (
            <Text style={styles.name}>---</Text>
          ) : (
            <Text style={styles.name}>{data?.name || '—'}</Text>
          )}
        </View>

        {/* Edit Button */}
        <View style={styles.editButtonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#1E3A8A" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Summary */}
        <View style={[styles.card, styles.performanceCard]}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="star" size={18} color="#1e1e1e" style={{ marginBottom: 10 }} />
            <Text style={styles.cardTitle}>Performance Summary</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>140</Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#facc15' }]}>
                {data?.rating ? data.rating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: 'green' }]}>
                {data?.numberOfReviews || 0}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.infoText}>Email: {data?.email || '—'}</Text>
          <Text style={[styles.infoText, { marginTop: 6 }]}>Phone: {data?.phone || '—'}</Text>
        </View>

        {/* Address Info */}
        {data?.address && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Address</Text>
            <Text style={styles.infoText}>
              {data.address.street && `${data.address.street}, `}
              {data.address.suburb && `${data.address.suburb}, `}
              {data.address.state && `${data.address.state} `}
              {data.address.postcode}
            </Text>
          </View>
        )}

        {/* License Status */}
        {data?.license && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>License Status</Text>
            <View style={styles.licenseContainer}>
              <View style={styles.licenseStatus}>
                <Text style={styles.licenseLabel}>Status:</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(data.license.status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(data.license.status)]}>
                    {data.license.status.charAt(0).toUpperCase() + data.license.status.slice(1)}
                  </Text>
                </View>
              </View>
              {data.license.rejectionReason && (
                <Text style={styles.rejectionReason}>Reason: {data.license.rejectionReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Certifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certifications</Text>
          <View style={styles.badgesRow}>
            {['Security License', 'CPR', 'First Aid'].map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
//styles for the profile screen
const styles = StyleSheet.create({
  //main screen container
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  // Padding around scroll view content
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Container for avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  // Avatar circle with icon inside
  avatar: {
    backgroundColor: '#1E3A8A',
    height: 100,
    width: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Name container
  nameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  // Name text below avatar
  name: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Edit button container
  editButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  // Edit button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  editButtonText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Reusable card style
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
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Card title style
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10,
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
  // Badge label
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
  licenseContainer: {
    marginTop: 10,
  },
  licenseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  licenseLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionReason: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
