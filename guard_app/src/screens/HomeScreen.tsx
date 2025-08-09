// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

/** Brand (inline so we only touch this file) */
const COLORS = {
  primary: "#274b93",
  secondary: "#072261",
  background: "#fafafa",
  textDark: "#15202B",
  textMuted: "#5A6B7A",
  divider: "#E9EEF3",
  cardBg: "#ffffff",
  rateGreen: "#1AAE5B",
  pendingBg: "#FFF7E6",
  pendingText: "#A56600",
  confirmedBg: "#E8F8EE",
  confirmedText: "#1F8D4D",
  rejectedBg: "#FDECEC",
  rejectedText: "#B00020",
};

/** Types + mock data (inline, static) */
type Shift = {
  id: string;
  company: string;
  role: string;
  hourlyRate: string; // "$55 p/h" or "$120"
  date: string;       // "03-08-2025"
  startTime: string;  // "6:00 pm"
  endTime: string;    // "11:00 pm"
  address: string;
  distance?: string;  // "1.2 km"
  status?: "available" | "applied" | "pending" | "confirmed" | "rejected";
};

const MOCK_SHIFTS: Shift[] = [
  // Available (button)
  {
    id: "s1",
    company: "Melbourne Central",
    role: "Retail Security",
    hourlyRate: "$120",
    date: "03-08-2025",
    startTime: "6:00 pm",
    endTime: "11:00 pm",
    address: "Swanston St, Melbourne VIC",
    distance: "1.2 km",
    status: "available",
  },
  {
    id: "s2",
    company: "Highpoint",
    role: "Retail Security",
    hourlyRate: "$150",
    date: "03-08-2025",
    startTime: "5:00 pm",
    endTime: "10:00 pm",
    address: "Maribyrnong VIC",
    distance: "6.1 km",
    status: "available",
  },
  // Applied/Pending (yellow pill)
  {
    id: "s3",
    company: "Chadstone",
    role: "Retail Security",
    hourlyRate: "$160",
    date: "03-08-2025",
    startTime: "8:00 pm",
    endTime: "11:00 pm",
    address: "Chadstone VIC",
    distance: "7.1 km",
    status: "pending",
  },
  // Confirmed (green pill)
  {
    id: "s4",
    company: "DFO South Wharf",
    role: "Retail Security",
    hourlyRate: "$180",
    date: "04-08-2025",
    startTime: "6:00 pm",
    endTime: "11:00 pm",
    address: "South Wharf VIC",
    distance: "3 km",
    status: "confirmed",
  },
];

/** Inline card component to avoid creating extra files */
const ShiftCard = ({
  shift,
  onApply,
}: {
  shift: Shift;
  onApply: (id: string) => void;
}) => {
  const pill =
    shift.status === "confirmed"
      ? { bg: COLORS.confirmedBg, color: COLORS.confirmedText, label: "Shift Confirmed" }
      : shift.status === "pending" || shift.status === "applied"
      ? { bg: COLORS.pendingBg, color: COLORS.pendingText, label: "Application Pending" }
      : shift.status === "rejected"
      ? { bg: COLORS.rejectedBg, color: COLORS.rejectedText, label: "Rejected" }
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.company}>{shift.company}</Text>
          <Text style={styles.role}>{shift.role}</Text>
        </View>
        <Text style={styles.rate}>{shift.hourlyRate}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.meta}>{shift.date}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.meta}>
          {shift.startTime} – {shift.endTime}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.meta}>{shift.address}</Text>
        {shift.distance ? <Text style={styles.distance}>  ·  {shift.distance}</Text> : null}
      </View>

      {pill ? (
        <View style={[styles.pillBanner, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillBannerText, { color: pill.color }]}>{pill.label}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(shift.id)}>
          <Text style={styles.applyText}>Apply for shift</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const onApply = (id: string) => console.log("Apply:", id);

  // Group to match the UI: Available → Applied/Pending → Confirmed
  const available = MOCK_SHIFTS.filter(s => s.status === "available");
  const pending = MOCK_SHIFTS.filter(s => s.status === "pending" || s.status === "applied");
  const confirmed = MOCK_SHIFTS.filter(s => s.status === "confirmed");

  const sections: { title: string; data: Shift[] }[] = [
    { title: "Available Shifts", data: available },
    { title: "Applied Shifts", data: pending },
    { title: "Confirmed Shifts", data: confirmed },
  ];

  return (
    <View style={styles.container}>
      {/* Top bar with Filter/Sort placeholders (non-functional) */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Your Shifts</Text>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topPill}><Text style={styles.topPillText}>Filter</Text></TouchableOpacity>
          <TouchableOpacity style={styles.topPill}><Text style={styles.topPillText}>Sort</Text></TouchableOpacity>
        </View>
      </View>

      {/* Sectioned lists */}
      <FlatList
        data={sections}
        keyExtractor={(sec) => sec.title}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: sec }) => (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {sec.data.map(shift => (
              <ShiftCard key={shift.id} shift={shift} onApply={onApply} />
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  topActions: { flexDirection: "row" },
  topPill: {
    backgroundColor: "#E7EEF6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  topPillText: { fontWeight: "700", color: COLORS.textDark },

  listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  company: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  role: { marginTop: 2, fontSize: 13, color: COLORS.textMuted },
  rate: { fontSize: 15, fontWeight: "800", color: COLORS.rateGreen },

  row: { marginTop: 10, flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  icon: { fontSize: 13, marginRight: 6 },
  meta: { fontSize: 13.5, color: COLORS.textDark },
  dot: { marginHorizontal: 6, color: COLORS.textMuted },
  distance: { fontSize: 13.5, color: COLORS.textMuted },

  applyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "700" },

  pillBanner: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  pillBannerText: { fontWeight: "700" },
});

export default HomeScreen;
