// src/screen/HomeScreen.tsx

import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import http from '../lib/http';
import { RootStackParamList } from '../navigation/AppNavigator';

type User = { name?: string; rating?: number };
type Shift = {
  title: string;
  date: string; // ISO
  status: 'assigned' | 'applied' | string;
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  payRate?: number; // $/hour
};
type Metrics = { confirmed: number; pending: number; earnings: number; rating: number };

const NAVY = '#244B7A';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';

const DEVICE_W = Dimensions.get('window').width;
const CANVAS = Math.min(390, DEVICE_W);
const P = 24;

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  let duration = (end - start + 1440) % 1440; // handle overnight
  if (duration === 0) duration = 1440;
  return duration;
}

function moneyForShift(s: Shift): string | undefined {
  if (!s.payRate || !s.startTime || !s.endTime) return undefined;
  const hours = minutesBetween(s.startTime, s.endTime) / 60;
  return `$${(s.payRate * hours).toFixed(0)}`;
}

const StatCard = ({
  icon,
  label,
  value,
  extraStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  extraStyle?: object;
}) => (
  <View style={[styles.statCard, extraStyle]}>
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
    <View style={styles.rowLeft}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{time}</Text>
    </View>
    {amount ? <Text style={styles.rowAmt}>{amount}</Text> : null}
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    confirmed: 0,
    pending: 0,
    earnings: 0,
    rating: 0,
  });
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Home',
      headerStyle: { backgroundColor: NAVY },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const load = async () => {
    try {
      const { data: u } = await http.get<User>('/users/me');
      setUser(u);

      const { data: myShifts } = await http.get<Shift[]>('/shifts/myshifts');

      const confirmed = myShifts.filter((s) => s.status === 'assigned').length;
      const pending = myShifts.filter((s) => s.status === 'applied').length;

      const todayStr = new Date().toDateString();
      const today = myShifts.filter(
        (s) => s.status === 'assigned' && new Date(s.date).toDateString() === todayStr,
      );

      const upcoming = myShifts.filter(
        (s) => s.status === 'assigned' && new Date(s.date) > new Date(),
      );

      const earnings = today.reduce((sum, s) => {
        if (!s.startTime || !s.endTime || !s.payRate) return sum;
        const hours = minutesBetween(s.startTime, s.endTime) / 60;
        return sum + s.payRate * hours;
      }, 0);

      setMetrics({
        confirmed,
        pending,
        earnings,
        rating: u?.rating ?? 0,
      });

      setTodayShifts(today);
      setUpcomingShifts(upcoming);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load home data:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.canvas}>
          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.h1}>Welcome back, {user?.name || 'Guard'}!</Text>
            <Text style={styles.h2}>Here’s your dashboard</Text>
          </View>

          {/* Metrics */}
          <View style={styles.grid}>
            <StatCard
              icon={<Ionicons name="calendar-outline" size={18} color="#3E63DD" />}
              label="Confirmed shifts"
              value={metrics.confirmed}
              extraStyle={styles.tintBlue}
            />
            <StatCard
              icon={<Ionicons name="time-outline" size={18} color="#C99A06" />}
              label="Pending Applications"
              value={metrics.pending}
              extraStyle={styles.tintYellow}
            />
            <StatCard
              icon={<Feather name="dollar-sign" size={18} color="#1A936F" />}
              label="Today’s Earning"
              value={`$${metrics.earnings.toFixed(0)}`}
              extraStyle={styles.tintGreen}
            />
            <StatCard
              icon={<MaterialCommunityIcons name="trending-up" size={18} color="#7C5CFC" />}
              label="Current Rating"
              value={metrics.rating}
              extraStyle={styles.tintPurple}
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

            {todayShifts.length > 0 ? (
              todayShifts.map((s, i) => (
                <RowItem
                  key={`${s.title}-${i}`}
                  title={s.title}
                  time={`${s.startTime ?? '--:--'} – ${s.endTime ?? '--:--'}`}
                  amount={moneyForShift(s)}
                  highlight
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No shifts scheduled for today</Text>
            )}
          </View>

          {/* Upcoming Shifts */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="clock" size={16} color={MUTED} />
                <Text style={styles.cardHeadTxt}>Upcoming Shifts</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Shifts')}>
                <Text style={styles.viewAll}>View All ›</Text>
              </TouchableOpacity>
            </View>

            {upcomingShifts.length > 0 ? (
              upcomingShifts
                .slice(0, 2)
                .map((s, i) => (
                  <RowItem
                    key={`${s.title}-${i}`}
                    title={s.title}
                    time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime ?? '--:--'} – ${
                      s.endTime ?? '--:--'
                    }`}
                    amount={moneyForShift(s)}
                  />
                ))
            ) : (
              <Text style={styles.emptyText}>No upcoming shifts</Text>
            )}
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canvas: { width: CANVAS },

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
    shadowOffset: { width: 0, height: 8 },
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
  cardHeadLeft: { alignItems: 'center', flexDirection: 'row' },
  cardHeadTxt: { color: MUTED, fontSize: 16, fontWeight: '700', marginLeft: 8 },

  emptyText: { color: MUTED, fontSize: 14, marginTop: 6 },

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
  h2: { color: '#6B7280', fontSize: 14, marginTop: 6, textAlign: 'center' },

  heading: { alignItems: 'center', paddingHorizontal: P, paddingTop: 18 },

  rowAmt: { color: '#1A936F', fontSize: 16, fontWeight: '900', paddingLeft: 10 },
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
  rowItemHL: { backgroundColor: '#EAF7EF', borderColor: '#D4F0DC' },
  rowLeft: { flex: 1 },
  rowSub: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  rowTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },

  safe: { backgroundColor: '#FFFFFF', flex: 1 },
  scroll: { alignItems: 'center' },
  spacer: { height: 88 },

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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: 36,
  },
  statLabel: { color: '#6B7280', fontSize: 12, marginTop: 10 },
  statTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { color: '#0F172A', fontSize: 20, fontWeight: '800' },

  tintBlue: { backgroundColor: '#EEF2FF' },
  tintGreen: { backgroundColor: '#EAF7EF' },
  tintPurple: { backgroundColor: '#ECEBFF' },
  tintYellow: { backgroundColor: '#FFF4C8' },

  viewAll: { color: '#3E63DD', fontSize: 15, fontWeight: '700' },
});
