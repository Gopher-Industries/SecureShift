/* eslint-disable react-native/no-inline-styles */
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

type AppliedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
};

type CompletedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  rated: boolean;
  rating: number;
};

/* Sample Data */
const APPLIED: AppliedShift[] = [
  {
    id: '1',
    title: 'Shopping Centre Security',
    company: 'Vicinity Centres',
    site: 'Chadstone Shopping Centre',
    rate: '$75 p/h',
    date: '2025-08-01',
    time: '1:00 pm - 9:00 pm',
    status: 'Pending',
  },
  {
    id: '2',
    title: 'Shopping Centre Security',
    company: 'Vicinity Centres',
    site: 'Chadstone Shopping Centre',
    rate: '$55 p/h',
    date: '2025-08-04',
    time: '12:00 pm - 7:30 pm',
    status: 'Pending',
  },
  {
    id: '3',
    title: 'Crowd Control',
    company: 'AIG Solutions',
    site: 'Marvel Stadium',
    rate: '$55 p/h',
    date: '2025-08-09',
    time: '5:00 pm - 1:00 am',
    status: 'Confirmed',
  },
  {
    id: '4',
    title: 'Crowd Control',
    company: 'MSS Security',
    site: 'Rod Laver Arena',
    rate: '$70 p/h',
    date: '2025-08-11',
    time: '3:00 pm - 11:00 pm',
    status: 'Rejected',
  },
];

const COMPLETED: CompletedShift[] = [
  {
    id: 'c1',
    title: 'Shopping Centre Security',
    company: 'Vicinity Centres',
    site: 'Chadstone Shopping Centre',
    rate: '$55 p/h',
    date: '2025-08-01',
    time: '1:00 pm - 9:00 pm',
    rated: false,
    rating: 0,
  },
  {
    id: 'c2',
    title: 'Crowd Control',
    company: 'Securecorp',
    site: 'MCG',
    rate: '$55 p/h',
    date: '2025-07-27',
    time: '1:00 pm - 9:00 pm',
    rated: true,
    rating: 4,
  },
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
        accessibilityLabel="Search shifts"
        accessibilityRole="search"
      />
      <TouchableOpacity
        style={s.filterBtn}
        accessibilityRole="button"
        accessibilityLabel="Open filter options"
      >
        <Text style={s.filterText}>☰</Text>
      </TouchableOpacity>
    </View>
  );
}

function Card({
  title,
  company,
  site,
  rate,
  children,
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
  const data = APPLIED.filter((x) =>
    (x.title + x.company + x.site).toLowerCase().includes(q.toLowerCase()),
  );

  const colorFor = (st: AppliedShift['status']) =>
    st === 'Pending'
      ? COLORS.status.pending
      : st === 'Confirmed'
        ? COLORS.status.confirmed
        : COLORS.status.rejected;

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} />
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card title={item.title} company={item.company} site={item.site} rate={item.rate}>
            <Text style={s.status}>
              <Text style={{ color: '#000' }}>Status: </Text>
              <Text style={{ color: colorFor(item.status) }}>{item.status}</Text>
            </Text>
            <View style={s.row}>
              <Text style={s.muted}>{formatDate(item.date)}</Text>
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
  return (
    <Text style={{ color: COLORS.link }}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </Text>
  );
}

function CompletedTab() {
  const [q, setQ] = useState('');
  const data = COMPLETED.filter((x) =>
    (x.title + x.company + x.site).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <View style={s.screen}>
      <Search q={q} setQ={setQ} />
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
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
              <Text style={s.muted}>{formatDate(item.date)}</Text>
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
      screenOptions={({ route }) => ({
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarStyle: {
          backgroundColor: '#E7E7EB',
          borderRadius: 12,
          marginHorizontal: 12,
          marginTop: 8,
          overflow: 'hidden', // keeps indicator rounded
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#274289', // blue background
          height: '100%', // fill the tab height
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          textTransform: 'none',
        },
        tabBarActiveTintColor: '#fff', // white text when active
        tabBarInactiveTintColor: '#000', // black text when inactive
      })}
    >
      <Top.Screen name="Applied" component={AppliedTab} />
      <Top.Screen name="Completed" component={CompletedTab} />
    </Top.Navigator>
  );
}

/* Styles */
const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    elevation: 2,
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  dot: { color: COLORS.muted, marginHorizontal: 6 },
  filterBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginLeft: 8,
    width: 40,
  },
  filterText: {
    color: COLORS.text,
    fontSize: 18,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row' },

  muted: { color: COLORS.muted },
  rate: { color: COLORS.rate, fontSize: 15, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row', marginTop: 8 },
  rowSpace: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  screen: { backgroundColor: COLORS.bg, flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  search: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
  },
  searchRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  status: { fontWeight: '600', marginTop: 10 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
});
