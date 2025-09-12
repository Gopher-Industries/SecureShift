// screen/HomeScreen.tsx

import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import http from '../lib/http';
import { RootStackParamList } from '../navigation/AppNavigator';

const NAVY = '#244B7A';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';

const DEVICE_W = Dimensions.get('window').width;
const CANVAS = Math.min(390, DEVICE_W);
const P = 24;

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
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{time}</Text>
    </View>
    {amount ? <Text style={styles.rowAmt}>{amount}</Text> : null}
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState({ confirmed: 0, pending: 0, earnings: 0, rating: 0 });
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<any[]>([]);
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
      const { data: u } = await http.get('/users/me');
      setUser(u);

      const { data: myShifts } = await http.get('/shifts/myshifts');
      const confirmed = myShifts.filter((s: any) => s.status === 'assigned').length;
      const pending = myShifts.filter((s: any) => s.status === 'applied').length;

      const today = myShifts.filter(
        (s: any) =>
          s.status === 'assigned' && new Date(s.date).toDateString() === new Date().toDateString(),
      );

      const upcoming = myShifts.filter(
        (s: any) => s.status === 'assigned' && new Date(s.date) > new Date(),
      );

      const earnings = today.reduce((sum: number, s: any) => {
        if (!s.startTime || !s.endTime || !s.payRate) return sum;

        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);

        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        let duration = (end - start + 1440) % 1440;
        if (duration === 0) duration = 1440;

        const hours = duration / 60;
        return sum + s.payRate * hours;
      }, 0);

      setMetrics({
        confirmed,
        pending,
        earnings,
        rating: u.rating || 0,
      });

      setTodayShifts(today);
      setUpcomingShifts(upcoming);
    } catch (err) {
      console.error('Failed to load home data:', err);
    }
  };

  useEffect(() => {
    load(); // initial load
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(); // reload when screen comes into focus
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
        <View style={{ width: CANVAS }}>
          {/* Heading */}
          <View style={{ paddingHorizontal: P, paddingTop: 18, alignItems: 'center' }}>
            <Text style={styles.h1}>Welcome back, {user?.name || 'Guard'}!</Text>
            <Text style={styles.h2}>Here’s your dashboard</Text>
          </View>

          {/* Metrics */}
          <View style={styles.grid}>
            <StatCard
              icon={<Ionicons name="calendar-outline" size={18} color="#3E63DD" />}
              label="Confirmed shifts"
              value={metrics.confirmed}
              tint="#EEF2FF"
            />
            <StatCard
              icon={<Ionicons name="time-outline" size={18} color="#C99A06" />}
              label="Pending Applications"
              value={metrics.pending}
              tint="#FFF4C8"
            />
            <StatCard
              icon={<Feather name="dollar-sign" size={18} color="#1A936F" />}
              label="Today’s Earning"
              value={`$${metrics.earnings}`}
              tint="#EAF7EF"
            />
            <StatCard
              icon={<MaterialCommunityIcons name="trending-up" size={18} color="#7C5CFC" />}
              label="Current Rating"
              value={metrics.rating}
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
            {todayShifts.length > 0 ? (
              todayShifts.map((s, i) => (
                <RowItem
                  key={i}
                  title={s.title}
                  time={`${s.startTime} – ${s.endTime}`}
                  amount={
                    s.payRate && s.startTime && s.endTime
                      ? (() => {
                          const [sh, sm] = s.startTime.split(':').map(Number);
                          const [eh, em] = s.endTime.split(':').map(Number);
                          const start = sh * 60 + sm;
                          const end = eh * 60 + em;
                          let duration = (end - start + 1440) % 1440;
                          if (duration === 0) duration = 1440;
                          const hours = duration / 60;
                          return `$${s.payRate * hours}`;
                        })()
                      : undefined
                  }
                  highlight
                />
              ))
            ) : (
              <Text style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>
                No shifts scheduled for today
              </Text>
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
              upcomingShifts.slice(0, 2).map((s, i) => (
                <RowItem
                  key={i}
                  title={s.title}
                  time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime} – ${s.endTime}`}
                  amount={
                    s.payRate && s.startTime && s.endTime
                      ? (() => {
                          const [sh, sm] = s.startTime.split(':').map(Number);
                          const [eh, em] = s.endTime.split(':').map(Number);
                          const start = sh * 60 + sm;
                          const end = eh * 60 + em;
                          let duration = (end - start + 1440) % 1440;
                          if (duration === 0) duration = 1440;
                          const hours = duration / 60;
                          return `$${s.payRate * hours}`;
                        })()
                      : undefined
                  }
                />
              ))
            ) : (
              <Text style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>No upcoming shifts</Text>
            )}
          </View>

          <View style={{ height: 88 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  rowSub: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  rowTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  safe: { backgroundColor: '#FFFFFF', flex: 1 },
  scroll: { alignItems: 'center' },
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
  viewAll: { color: '#3E63DD', fontSize: 15, fontWeight: '700' },
});
