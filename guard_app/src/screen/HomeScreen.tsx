/* eslint-disable react-native/no-inline-styles */
// src/screen/HomeScreen.tsx
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
const BLUE = '#3E63DD';
const GREEN = '#1A936F';

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
    {!!amount && <Text style={styles.rowAmt}>{amount}</Text>}
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Messages')}
            style={{ paddingHorizontal: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{ paddingHorizontal: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ paddingLeft: 8 }}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
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

      setMetrics({ confirmed, pending, earnings, rating: u?.rating ?? 0 });
      setTodayShifts(today);
      setUpcomingShifts(upcoming);
    } catch (err) {
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
              icon={<Ionicons name="calendar-outline" size={18} color={BLUE} />}
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
              icon={<Feather name="dollar-sign" size={18} color={GREEN} />}
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
                <TouchableOpacity
                  key={`${s.title}-${i}`}
                  onPress={() =>
                    navigation.navigate('ShiftDetails', { shift: s as any, refresh: load })
                  }
                >
                  <RowItem
                    title={s.title}
                    time={`${s.startTime ?? '--:--'} – ${s.endTime ?? '--:--'}`}
                    amount={moneyForShift(s)}
                    highlight
                  />
                </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => navigation.navigate('AppTabs' as any, { screen: 'Shifts' })}
              >
                <Text style={styles.viewAll}>View All ›</Text>
              </TouchableOpacity>
            </View>

            {upcomingShifts.length > 0 ? (
              upcomingShifts.slice(0, 2).map((s, i) => (
                <TouchableOpacity
                  key={`${s.title}-${i}`}
                  onPress={() =>
                    navigation.navigate('ShiftDetails', { shift: s as any, refresh: load })
                  }
                >
                  <RowItem
                    title={s.title}
                    time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime ?? '--:--'} – ${
                      s.endTime ?? '--:--'
                    }`}
                    amount={moneyForShift(s)}
                  />
                </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { alignItems: 'center' },
  canvas: { width: CANVAS },

  // Headings
  heading: { alignItems: 'center', paddingHorizontal: P, paddingTop: 18 },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  h2: { fontSize: 14, color: '#6B7280', marginTop: 6, textAlign: 'center' },

  // Metrics
  grid: {
    paddingHorizontal: P,
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: { width: (CANVAS - P * 2 - 12) / 2, borderRadius: 22, padding: 16, marginBottom: 12 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  statLabel: { marginTop: 10, fontSize: 12, color: '#6B7280' },
  tintBlue: { backgroundColor: '#EEF2FF' },
  tintYellow: { backgroundColor: '#FFF4C8' },
  tintGreen: { backgroundColor: '#EAF7EF' },
  tintPurple: { backgroundColor: '#ECEBFF' },

  // Cards
  card: {
    marginHorizontal: P,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  cardHead: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center' },
  cardHeadTxt: { marginLeft: 8, fontSize: 16, color: MUTED, fontWeight: '700' },

  // Rows
  rowItem: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowItemHL: { backgroundColor: '#EAF7EF', borderColor: '#D4F0DC' },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  rowSub: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  rowAmt: { fontSize: 16, fontWeight: '900', color: GREEN, paddingLeft: 10 },

  emptyText: { color: MUTED, fontSize: 14, marginTop: 6 },
  viewAll: { fontSize: 15, color: '#3E63DD', fontWeight: '700' },

  spacer: { height: 88 },
});
