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
  Pressable,
  Image,
} from 'react-native';

import { getUserProfile } from '../api/profile';
import { LocalStorage } from '../lib/localStorage';
import { LicenseStatus } from '../models/License';
import { UserProfile } from '../models/UserProfile';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

export default function ProfileScreen({ navigation, route }: any) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleEditProfile = () => {
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
      console.log('Fetched profile data:', profile);
      setData(profile);
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
    loadProfileImage();
  }, []);

  useEffect(() => {
    if (route?.params?.refresh) {
      loadProfileData();
      loadProfileImage();
      navigation.setParams({ refresh: false });
    }
  }, [navigation, route?.params?.refresh]);

  const getStatusBadgeStyle = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.VERIFIED:
        return {
          backgroundColor: colors.greenSoft,
          borderColor: colors.status.confirmed,
        };
      case LicenseStatus.PENDING:
        return {
          backgroundColor: colors.yellowSoft,
          borderColor: colors.status.pending,
        };
      case LicenseStatus.REJECTED:
        return {
          backgroundColor: colors.card,
          borderColor: colors.status.rejected,
        };
      default:
        return {
          backgroundColor: colors.primarySoft,
          borderColor: colors.border,
        };
    }
  };

  const getStatusTextStyle = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.VERIFIED:
        return { color: colors.status.confirmed };
      case LicenseStatus.PENDING:
        return { color: colors.status.pending };
      case LicenseStatus.REJECTED:
        return { color: colors.status.rejected };
      default:
        return { color: colors.text };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color={colors.white} />
            </View>
          )}
        </View>

        <View style={styles.nameContainer}>
          {loading || error ? (
            <Text style={styles.name}>---</Text>
          ) : (
            <Text style={styles.name}>{data?.name || '—'}</Text>
          )}
        </View>

        <View style={styles.editButtonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.performanceCard]}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="star" size={18} color={colors.text} style={{ marginBottom: 10 }} />
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
              <Text style={[styles.statValue, { color: colors.status.confirmed }]}>
                {data?.numberOfReviews || 0}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.infoText}>Email: {data?.email || '—'}</Text>
          <Text style={[styles.infoText, { marginTop: 6 }]}>Phone: {data?.phone || '—'}</Text>
        </View>

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

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.card}
          onPress={() => navigation.navigate('Certificates')}
        >
          <Text style={styles.cardTitle}>Certifications</Text>
          <View style={styles.badgesRow}>
            {['Security License', 'CPR', 'First Aid'].map((badge) => (
              <Pressable
                key={badge}
                style={({ pressed }) => [styles.badge, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('Documents', { docType: badge })}
              >
                <Text style={styles.badgeText}>{badge}</Text>
              </Pressable>
            ))}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      backgroundColor: colors.primary,
      height: 100,
      width: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    nameContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    name: {
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.text,
    },
    editButtonContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    editButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
    },
    performanceCard: {
      backgroundColor: colors.primarySoft,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontWeight: 'bold',
      fontSize: 15,
      marginBottom: 10,
      color: colors.text,
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
      color: colors.muted,
      marginTop: 2,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    badge: {
      backgroundColor: colors.primarySoft,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 12,
      color: colors.primary,
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
      color: colors.text,
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
      color: colors.status.rejected,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });
