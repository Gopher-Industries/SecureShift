// screen/HomeScreen.tsx

import React, { useLayoutEffect, useEffect, useState, useCallback } from "react"; 
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
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import http from "../lib/http";

const NAVY = "#244B7A";
const BORDER = "#E7EBF2";
const MUTED = "#5C667A";

const DEVICE_W = Dimensions.get("window").width;
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
      title: "Home",
      headerStyle: { backgroundColor: NAVY },
      headerTintColor: "#fff",
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const load = async () => {
    try {
      const { data: u } = await http.get("/users/me");
      setUser(u);

      const { data: myShifts } = await http.get("/shifts/myshifts");
      const confirmed = myShifts.filter((s: any) => s.status === "assigned").length;
      const pending = myShifts.filter((s: any) => s.status === "applied").length;

      const today = myShifts.filter(
        (s: any) =>
          s.status === "assigned" &&
          new Date(s.date).toDateString() === new Date().toDateString()
      );

      const upcoming = myShifts.filter(
        (s: any) => s.status === "assigned" && new Date(s.date) > new Date()
      );

      const earnings = today.reduce((sum: number, s: any) => sum + (s.payRate || 0), 0);

      setMetrics({
        confirmed,
        pending,
        earnings,
        rating: u.rating || 0,
      });

      setTodayShifts(today);
      setUpcomingShifts(upcoming);
    } catch (err) {
      console.error("Failed to load home data:", err);
    }
  };

  useEffect(() => {
    load(); // initial load
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(); // reload when screen comes into focus
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true); // start spinner
    await load(); // refetch data
    setRefreshing(false); // stop spinner
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} // added pull-to-refresh
      >
        <View style={{ width: CANVAS }}>
          {/* Heading */}
          <View style={{ paddingHorizontal: P, paddingTop: 18, alignItems: "center" }}>
            <Text style={styles.h1}>Welcome back, {user?.name || "Guard"}!</Text>
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
                  amount={s.payRate ? `$${s.payRate}` : undefined}
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
              <TouchableOpacity onPress={() => navigation.navigate("Shifts")}>
                <Text style={styles.viewAll}>View All ›</Text>
              </TouchableOpacity>
            </View>
            {upcomingShifts.length > 0 ? (
              upcomingShifts.slice(0, 2).map((s, i) => (
                <RowItem
                  key={i}
                  title={s.title}
                  time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime} – ${s.endTime}`}
                  amount={s.payRate ? `$${s.payRate}` : undefined}
                />
              ))
            ) : (
              <Text style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>
                No upcoming shifts
              </Text>
            )}
          </View>

          <View style={{ height: 88 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { alignItems: "center" },
  h1: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: 0.2, textAlign: "center" },
  h2: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },
  grid: {
    paddingHorizontal: P,
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (CANVAS - P * 2 - 12) / 2,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  statLabel: { marginTop: 10, fontSize: 12, color: "#6B7280" },
  card: {
    marginHorizontal: P,
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  cardHead: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeadLeft: { flexDirection: "row", alignItems: "center" },
  cardHeadTxt: { marginLeft: 8, fontSize: 16, color: MUTED, fontWeight: "700" },
  viewAll: { fontSize: 15, color: "#3E63DD", fontWeight: "700" },
  rowItem: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  rowItemHL: { backgroundColor: "#EAF7EF", borderColor: "#D4F0DC" },
  rowTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  rowSub: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  rowAmt: { fontSize: 16, fontWeight: "900", color: "#1A936F", paddingLeft: 10 },
});