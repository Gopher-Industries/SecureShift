import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Shift } from '../navigation/AppNavigator';

const NAVY = '#244B7A';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';
const WHITE = '#FFFFFF';
const INK = '#0F172A';
const INK_SUB = '#6B7280';
const BLUE = '#3E63DD';
const GREEN = '#1A936F';

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
  shift,
  onPress,
  highlight,
}: {
  shift: Shift;
  onPress: (s: Shift) => void;
  highlight?: boolean;
}) => (
  <TouchableOpacity
    onPress={() => onPress(shift)}
    activeOpacity={0.9}
    style={[styles.rowItem, highlight && styles.rowItemHL]}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{shift.title}</Text>
      <Text style={styles.rowSub}>
        {shift.date}, {shift.time}
      </Text>
    </View>
    <Text style={styles.rowAmt}>${shift.pay}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState(false);

  // demo data (replace with API later)
  const upcoming = useMemo<Shift[]>(
    () => [
      { id: '1', title: 'Hospital Complex', date: '10-08-2025', time: '9:00 AM – 5:00 PM', pay: 200 },
      { id: '2', title: 'Woolworths', date: '12-08-2025', time: '9:00 AM – 5:00 PM', pay: 170 },
      { id: '3', title: 'Stadium Security', date: '15-08-2025', time: '4:00 PM – 11:00 PM', pay: 220 },
      { id: '4', title: 'City Mall', date: '20-08-2025', time: '9:00 AM – 5:00 PM', pay: 180 },
    ],
    [],
  );

  const visibleShifts = expanded ? upcoming : upcoming.slice(0, 2);

  const openDetails = (shift: Shift) => navigation.navigate('ShiftDetails', { shift });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Home',
      headerStyle: { backgroundColor: NAVY },
      headerTintColor: WHITE,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Messages')} style={{ paddingHorizontal: 8 }}>
            <Ionicons name="chatbubble-outline" size={22} color={WHITE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ paddingHorizontal: 8 }}>
            <Ionicons name="notifications-outline" size={22} color={WHITE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ paddingLeft: 8 }}>
            <Ionicons name="settings-outline" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: CANVAS }}>
          {/* Heading */}
          <View style={{ paddingHorizontal: P, paddingTop: 18, alignItems: 'center' }}>
            <Text style={styles.h1}>Welcome back, Alex!</Text>
            <Text style={styles.h2}>Here’s your dashboard</Text>
          </View>

          {/* Metrics */}
          <View style={styles.grid}>
            <StatCard
              icon={<Ionicons name="calendar-outline" size={18} color={BLUE} />}
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
              icon={<Feather name="dollar-sign" size={18} color={GREEN} />}
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
            <RowItem
              shift={{ id: '0', title: 'Shopping Center', date: 'Today', time: '9:00 AM – 5:00', pay: 100 }}
              onPress={openDetails}
              highlight
            />
          </View>

          {/* Upcoming Shifts (expandable) */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="clock" size={16} color={MUTED} />
                <Text style={styles.cardHeadTxt}>Upcoming Shifts</Text>
              </View>
              <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
                <Text style={styles.viewAll}>{expanded ? 'Show less' : 'View All ›'}</Text>
              </TouchableOpacity>
            </View>

            {visibleShifts.map((s) => (
              <RowItem key={s.id} shift={s} onPress={openDetails} />
            ))}
          </View>

          <View style={{ height: 88 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  scroll: { alignItems: 'center' },

  // Headings
  h1: { fontSize: 28, fontWeight: '800', color: INK, letterSpacing: 0.2, textAlign: 'center' },
  h2: { fontSize: 14, color: INK_SUB, marginTop: 6, textAlign: 'center' },

  // Metrics grid
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
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: INK },
  statLabel: { marginTop: 10, fontSize: 12, color: INK_SUB },

  // Outer white cards
  card: {
    marginHorizontal: P,
    marginTop: 18,
    backgroundColor: WHITE,
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
  viewAll: { fontSize: 15, color: BLUE, fontWeight: '700' },

  // Inner pills
  rowItem: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowItemHL: { backgroundColor: '#EAF7EF', borderColor: '#D4F0DC' },
  rowTitle: { fontSize: 18, fontWeight: '800', color: INK },
  rowSub: { fontSize: 13, color: INK_SUB, marginTop: 6 },
  rowAmt: { fontSize: 16, fontWeight: '900', color: GREEN, paddingLeft: 10 },
});
