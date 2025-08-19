// screens/HomeScreen.tsx
// Dashboard-only — matches your 390×849 Figma

import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const NAVY = "#244B7A";
const BORDER = "#E7EBF2";
const MUTED = "#5C667A";

const DEVICE_W = Dimensions.get("window").width;
const CANVAS = Math.min(390, DEVICE_W); // lock to Figma width
const P = 24; // page padding

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
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Top blue strip */}
      <View style={styles.topBar}>
        <View />
        <View style={styles.topIcons}>
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginLeft: 16 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: CANVAS }}>
          {/* Heading */}
          <View style={{ paddingHorizontal: P, paddingTop: 18, alignItems: "center" }}>
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

          <View style={{ height: 88 }} />
        </View>
      </ScrollView>

      {/* Bottom tabs (visual) */}
      <View style={styles.tabBar}>
        <View style={styles.tabActive}>
          <Ionicons name="home" size={20} color="#0F172A" />
          <Text style={styles.tabTextActive}>Home</Text>
        </View>
        <View style={styles.tab}>
          <Ionicons name="briefcase-outline" size={20} color="#9AA3AF" />
          <Text style={styles.tabText}>Shifts</Text>
        </View>
        <View style={styles.tab}>
          <Ionicons name="person-outline" size={20} color="#9AA3AF" />
          <Text style={styles.tabText}>Profile</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  topBar: {
    height: 48,
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topIcons: { flexDirection: "row", alignItems: "center" },

  scroll: { alignItems: "center" },

  // Headings
  h1: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: 0.2, textAlign: "center" },
  h2: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },

  // Metrics grid
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

  // Outer white cards
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

  // Inner pills
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

  // Bottom tabs
  tabBar: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F6",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 8,
  },
  tab: { alignItems: "center", justifyContent: "center" },
  tabActive: { alignItems: "center", justifyContent: "center" },
  tabText: { fontSize: 12, color: "#9AA3AF", marginTop: 4 },
  tabTextActive: { fontSize: 12, color: "#17223B", fontWeight: "800", marginTop: 4 },
});
