// guard_app/src/screen/HomeScreen.tsx
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { RootStackParamList } from '../navigation/AppNavigator';

const NAVY = '#244B7A';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';

const DEVICE_W = Dimensions.get('window').width;
const CANVAS = Math.min(390, DEVICE_W);
const P = 24;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const StatCard = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}) => (
  <View style={[styles.statCard, { backgroundColor: tint }]}>
    <View style={styles.statTop}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RowItem = ({
  title,
  time,
  amount,
  highlight,
}: {
  title: string;
  time: string;
  amount?: string;
  highlight?: boolean;
}) => (
  <View style={[styles.rowItem, highlight && styles.rowItemHL]}>
    <View style={styles.rowItemLeft}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{time}</Text>
    </View>
    {amount ? <Text style={styles.rowAmt}>{amount}</Text> : null}
  </View>
);

export default function HomeScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Home',
      headerStyle: { backgroundColor: NAVY },
      headerTintColor: '#fff',
      headerRight: () => (
        <View style={styles.headerIcons}>
          <TouchableOpacity
            accessibilityLabel="Messages"
            onPress={() => navigation.navigate('Messages')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Settings"
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.canvas}>
          {/* Heading */}
          <View style={styles.headerWrap}>
            <Text style={styles.h1}>Welcome back, Alex!</Text>
            <Text style={styles.h2}>Here’s your dashboard</Text>
          </View>

          {/* Metrics */}
          <View style={styles.grid}>
            <StatCard
              icon={<Ionicons name="calendar-outline" size={18} color="#3E63DD" />}
              label="Confirmed shifts"
              value="3"
              tint="#EEF2FF"
            />
            <StatCard
              icon={<Ionicons name="time-outline" size={18} color="#C99A06" />}
              label="Pending Applications"
              value="2"
              tint="#FFF4C8"
            />
            <StatCard
              icon={<Feather name="dollar-sign" size={18} color="#1A936F" />}
              label="Today’s Earning"
              value="$260"
              tint="#EAF7EF"
            />
            <StatCard
              icon={<MaterialCommunityIcons name="trending-up" size={18} color="#7C5CFC" />}
              label="Current Rating"
              value="4.9"
              tint="#ECEBFF"
            />
          </View>

          {/* Today’s Schedule */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="calendar" size={16} color={MUTED} />
                <Text style={styles.cardHeadTxt}>Today’s Schedule</Text>
              </View>
            </View>
            <RowItem title="Shopping Center" time="9:00 AM – 5:00" amount="$100" highlight />
          </View>

          {/* Upcoming Shifts */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="clock" size={16} color={MUTED} />
                <Text style={styles.cardHeadTxt}>Upcoming Shifts</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All ›</Text>
              </TouchableOpacity>
            </View>
            <RowItem title="Hospital Complex" time="10-08-2025, 9:00 AM – 5:00 PM" amount="$200" />
            <RowItem title="Woolworths" time="12-08-2025, 9:00 AM – 5:00 PM" amount="$170" />
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // put canvas before any 'card*' keys
  canvas: {
    width: CANVAS,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    marginHorizontal: P,
    marginTop: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  cardHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cardHeadLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardHeadTxt: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: P,
  },
  h1: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  h2: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  headerIconBtn: {
    marginLeft: 14,
  },
  headerIcons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerWrap: {
    alignItems: 'center',
    paddingHorizontal: P,
    paddingTop: 18,
  },

  rowAmt: {
    color: '#1A936F',
    fontSize: 16,
    fontWeight: '900',
    paddingLeft: 10,
  },
  rowItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    padding: 16,
  },
  rowItemHL: {
    backgroundColor: '#EAF7EF',
    borderColor: '#D4F0DC',
  },
  rowItemLeft: {
    flex: 1,
  },
  rowSub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 6,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },

  safe: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scroll: {
    alignItems: 'center',
  },
  spacer: {
    height: 88,
  },

  statCard: {
    borderRadius: 22,
    marginBottom: 12,
    padding: 16,
    width: (CANVAS - P * 2 - 12) / 2,
  },
  statIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: 36,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
  },
  statTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },

  viewAll: {
    color: '#3E63DD',
    fontSize: 15,
    fontWeight: '700',
  },
});
