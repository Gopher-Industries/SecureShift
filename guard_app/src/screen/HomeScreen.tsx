/* eslint-disable react-native/no-inline-styles */
// src/screen/HomeScreen.tsx
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
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
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';
import { showLocalNotification } from '../utils/notificationHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type User = { name?: string; rating?: number };
type Shift = {
  title: string;
  date: string;
  status: 'assigned' | 'applied' | string;
  startTime?: string;
  endTime?: string;
  payRate?: number;
};
type Metrics = { confirmed: number; pending: number; earnings: number; rating: number };

const DEVICE_W = Dimensions.get('window').width;
const CANVAS = Math.min(390, DEVICE_W);
const P = 24;

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  let duration = (end - start + 1440) % 1440;
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
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  extraStyle?: object;
  colors: AppColors;
}) => {
  const styles = getStyles(colors);

  return (
    <View style={[styles.statCard, extraStyle]}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const RowItem = ({
  title,
  time,
  amount,
  highlight,
  colors,
}: {
  title: string;
  time: string;
  amount?: string;
  highlight?: boolean;
  colors: AppColors;
}) => {
  const styles = getStyles(colors);

  return (
    <View style={[styles.rowItem, highlight && styles.rowItemHL]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{time}</Text>
      </View>
      {!!amount && <Text style={styles.rowAmt}>{amount}</Text>}
    </View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark, colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

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
      headerStyle: { backgroundColor: colors.header },
      headerTintColor: colors.white,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Payroll')}
            style={{ paddingHorizontal: 8 }}
          >
            <Ionicons name="card-outline" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Messages')}
            style={{ paddingHorizontal: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{ paddingHorizontal: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ paddingLeft: 8 }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors]);

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.canvas}>
          <View style={styles.heading}>
            <Text style={styles.h1}>
              {user?.name
                ? t('home.welcome', { name: user.name })
                : t('home.welcomeFallback', 'Welcome back, Guard!')}
            </Text>
            <Text style={styles.h2}>{t('home.dashboard')}</Text>
          </View>

          <View style={styles.grid}>
            <StatCard
              icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
              label={t('home.confirmedShifts')}
              value={metrics.confirmed}
              extraStyle={styles.tintBlue}
              colors={colors}
            />
            <StatCard
              icon={<Ionicons name="time-outline" size={18} color="#C99A06" />}
              label={t('home.pendingApps')}
              value={metrics.pending}
              extraStyle={styles.tintYellow}
              colors={colors}
            />
            <StatCard
              icon={<Feather name="dollar-sign" size={18} color={colors.success} />}
              label={t('home.todayEarning')}
              value={`$${metrics.earnings.toFixed(0)}`}
              extraStyle={styles.tintGreen}
              colors={colors}
            />
            <StatCard
              icon={<MaterialCommunityIcons name="trending-up" size={18} color="#7C5CFC" />}
              label={t('home.currentRating')}
              value={metrics.rating}
              extraStyle={styles.tintPurple}
              colors={colors}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="calendar" size={16} color={colors.muted} />
                <Text style={styles.cardHeadTxt}>{t('home.todaySchedule')}</Text>
              </View>
            </View>

            {todayShifts.length > 0 ? (
              todayShifts.map((s, i) => (
                <TouchableOpacity
                  key={`${s.title}-${i}`}
                  onPress={() => navigation.navigate('ShiftDetails', { shift: s as any })}
                >
                  <RowItem
                    title={s.title}
                    time={`${s.startTime ?? '--:--'} – ${s.endTime ?? '--:--'}`}
                    amount={moneyForShift(s)}
                    highlight
                    colors={colors}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>{t('home.noShiftsToday')}</Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardHeadLeft}>
                <Feather name="clock" size={16} color={colors.muted} />
                <Text style={styles.cardHeadTxt}>{t('home.upcomingShifts')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('AppTabs' as any, { screen: 'Shifts' })}
              >
                <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            {upcomingShifts.length > 0 ? (
              upcomingShifts.slice(0, 2).map((s, i) => (
                <TouchableOpacity
                  key={`${s.title}-${i}`}
                  onPress={() => navigation.navigate('ShiftDetails', { shift: s as any })}
                >
                  <RowItem
                    title={s.title}
                    time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime ?? '--:--'} – ${
                      s.endTime ?? '--:--'
                    }`}
                    amount={moneyForShift(s)}
                    colors={colors}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>{t('home.noUpcoming')}</Text>
            )}
          </View>

          <View style={{ justifyContent: 'center', padding: 20 }}>
            <Button
              title={t('homeExtras.testNotif')}
              onPress={async () => {
                await showLocalNotification(t('homeExtras.notifTitle'), t('homeExtras.notifBody'));
              }}
            />
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { alignItems: 'center' },
    canvas: { width: CANVAS },

    heading: { alignItems: 'center', paddingHorizontal: P, paddingTop: 18 },
    h1: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    h2: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 6,
      textAlign: 'center',
    },

    grid: {
      paddingHorizontal: P,
      marginTop: 18,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (CANVAS - P * 2 - 12) / 2,
      borderRadius: 22,
      padding: 16,
      marginBottom: 12,
    },
    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      marginTop: 10,
      fontSize: 12,
      color: colors.muted,
    },
    tintBlue: { backgroundColor: colors.primarySoft },
    tintYellow: { backgroundColor: colors.yellowSoft },
    tintGreen: { backgroundColor: colors.greenSoft },
    tintPurple: { backgroundColor: colors.purpleSoft },

    card: {
      marginHorizontal: P,
      marginTop: 18,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
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
    cardHeadLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardHeadTxt: {
      marginLeft: 8,
      fontSize: 16,
      color: colors.muted,
      fontWeight: '700',
    },

    rowItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowItemHL: {
      backgroundColor: colors.rowHighlight,
      borderColor: colors.rowHighlightBorder,
    },
    rowLeft: { flex: 1 },
    rowTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    rowSub: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 6,
    },
    rowAmt: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.success,
      paddingLeft: 10,
    },

    emptyText: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 6,
    },
    viewAll: {
      fontSize: 15,
      color: colors.link,
      fontWeight: '700',
    },

    spacer: { height: 88 },
  });
