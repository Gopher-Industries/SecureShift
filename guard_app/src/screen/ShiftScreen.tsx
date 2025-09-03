import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

/* Colour Palette */
const COLORS = {
  bg: '#F6F7FB',
  card: '#FFF',
  text: '#111',
  muted: '#667',
  primary: '#274289',
  rate: '#1AAE5B',
  link: '#1660CF',
  pending: '#A56600',
  confirmed: '#1F8D4D',
  rejected: '#B00020',
};

type AppliedShift = {
  id: string; title: string; company: string; site: string;
  rate: string; date: string; time: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
};

type CompletedShift = {
  id: string; title: string; company: string; site: string;
  rate: string; date: string; time: string;
  rated: boolean; rating: number;
};

/* Sample Data */
const APPLIED: AppliedShift[] = [
  { id: '1', title: 'Shopping Centre Security', company: 'Vicinity Centres', site: 'Chadstone Shopping Centre', rate: '$75 p/h', date: '01-08-2025', time: '1:00 pm - 9:00 pm', status: 'Pending' },
  { id: '2', title: 'Shopping Centre Security', company: 'Vicinity Centres', site: 'Chadstone Shopping Centre', rate: '$55 p/h', date: '04-08-2025', time: '12:00 pm - 7:30 pm', status: 'Pending' },
  { id: '3', title: 'Crowd Control', company: 'AIG Solutions', site: 'Marvel Stadium', rate: '$55 p/h', date: '09-08-2025', time: '5:00 pm - 1:00 am', status: 'Confirmed' },
];

const COMPLETED: CompletedShift[] = [
  { id: 'c1', title: 'Shopping Centre Security', company: 'Vicinity Centres', site: 'Chadstone Shopping Centre', rate: '$55 p/h', date: '01-08-2025', time: '1:00 pm - 9:00 pm', rated: false, rating: 0 },
  { id: 'c2', title: 'Crowd Control', company: 'Securecorp', site: 'MCG', rate: '$55 p/h', date: '27-07-2025', time: '1:00 pm - 9:00 pm', rated: true, rating: 4 },
];

/* Search Bar (Shared for each tab) */
function Search({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <View style={s.searchRow}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search shifts..."
        placeholderTextColor="#A0A7B1"
        style={s.search}
      />
      <TouchableOpacity style={s.filterBtn}><Text>☰</Text></TouchableOpacity>
    </View>
  );
}

function Card({
  title, company, site, rate, children,
}: React.PropsWithChildren<{ title: string; company: string; site: string; rate: string }>) {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.muted}>{company}</Text>
          <Text style={s.muted}>{site}</Text>
        </View>
        <Text style={s.rate}>{rate}</Text>
      </View>
      {children}
    </View>
  );
}

/* --- Applied tab --- */
function AppliedTab() {
  const [q, setQ] = useState('');
  const data = APPLIED.filter(x =>
    (x.title + x.company + x.site).toLowerCase().includes(q.toLowerCase())
  );

  const colorFor = (st: AppliedShift['status']) =>
    st === 'Pending' ? COLORS.pending : st === 'Confirmed' ? COLORS.confirmed : COLORS.rejected;

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} />
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card title={item.title} company={item.company} site={item.site} rate={item.rate}>
            <Text style={s.status}>
              <Text style={{ color: '#000' }}>Status: </Text>
              <Text style={{ color: colorFor(item.status) }}>{item.status}</Text>
            </Text>
            <View style={s.row}>
              <Text style={s.muted}>{item.date}</Text>
              <Text style={s.dot}> • </Text>
              <Text style={s.muted}>{item.time}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

/* --- Completed tab --- */
function Stars({ n }: { n: number }) {
  return <Text style={{ color: COLORS.link }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</Text>;
}

function CompletedTab() {
  const [q, setQ] = useState('');
  const data = COMPLETED.filter(x =>
    (x.title + x.company + x.site).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} />
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card title={item.title} company={item.company} site={item.site} rate={item.rate}>
            <View style={s.rowSpace}>
              <Text style={s.status}>
                <Text style={{ color: '#000' }}>Status: </Text>
                <Text style={{ color: COLORS.link }}>
                  Completed {item.rated ? '(Rated)' : '(Unrated)'}
                </Text>
              </Text>
              <Stars n={item.rating} />
            </View>
            <View style={s.row}>
              <Text style={s.muted}>{item.date}</Text>
              <Text style={s.dot}> • </Text>
              <Text style={s.muted}>{item.time}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

/* Top Bar Container */
const Top = createMaterialTopTabNavigator();

export default function ShiftScreen() {
  return (
    <Top.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#E7E7EB",
          borderRadius: 12,
          marginHorizontal: 12,
          marginTop: 8,
          overflow: 'hidden', // keeps indicator rounded
        },
        tabBarIndicatorStyle: {
          backgroundColor: "#274289", // blue background
          height: '100%',              // fill the tab height
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: "700",
          textTransform: "none",
        },
        tabBarActiveTintColor: "#fff", // white text when active
        tabBarInactiveTintColor: "#000", // black text when inactive
      }}
    >
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}


/* Styles */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 8 },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, height: 44, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterBtn: {
    marginLeft: 8, width: 40, height: 44, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginVertical: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  muted: { color: COLORS.muted },
  rate: { fontSize: 15, fontWeight: '800', color: COLORS.rate },

  status: { marginTop: 10, fontWeight: '600' },
  row: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  rowSpace: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { color: COLORS.muted, marginHorizontal: 6 },
});