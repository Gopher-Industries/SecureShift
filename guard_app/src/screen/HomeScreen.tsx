// src/screen/HomeScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Dimensions, RefreshControl, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import http from '../lib/http';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type User = { name?: string; rating?: number };
type Shift = { title: string; date: string; status: 'assigned' | 'applied' | string; startTime?: string; endTime?: string; payRate?: number; };
type Metrics = { confirmed: number; pending: number; earnings: number; rating: number };

const NAVY = '#244B7A', BORDER = '#E7EBF2', MUTED = '#5C667A', BLUE = '#3E63DD', GREEN = '#1A936F';
const DEVICE_W = Dimensions.get('window').width, CANVAS = Math.min(390, DEVICE_W), P = 24;

function minutesBetween(a: string, b: string){const [ah,am]=a.split(':').map(Number);const [bh,bm]=b.split(':').map(Number);let d=(bh*60+bm)-(ah*60+am);d=(d+1440)%1440;return d||1440;}
const moneyForShift=(s:Shift)=> (s.payRate&&s.startTime&&s.endTime)?`$${((minutesBetween(s.startTime,s.endTime)/60)*s.payRate).toFixed(0)}`:undefined;

const StatCard=({icon,label,value,extraStyle}:{icon:React.ReactNode;label:string;value:string|number;extraStyle?:object})=>(
  <View style={[styles.statCard,extraStyle]}><View style={styles.statTop}>
    <View style={styles.statIcon}>{icon}</View><Text style={styles.statValue}>{value}</Text></View>
    <Text style={styles.statLabel}>{label}</Text></View>);

const RowItem=({title,time,amount,highlight}:{title:string;time:string;amount?:string;highlight?:boolean})=>(
  <View style={[styles.rowItem,highlight&&styles.rowItemHL]}><View style={styles.rowLeft}>
    <Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{time}</Text></View>
    {!!amount&&<Text style={styles.rowAmt}>{amount}</Text>}</View>);

export default function HomeScreen(){
  const navigation=useNavigation<Nav>();
  const [user,setUser]=useState<User|null>(null);
  const [metrics,setMetrics]=useState<Metrics>({confirmed:0,pending:0,earnings:0,rating:0});
  const [todayShifts,setTodayShifts]=useState<Shift[]>([]);
  const [upcomingShifts,setUpcomingShifts]=useState<Shift[]>([]);
  const [refreshing,setRefreshing]=useState(false);

  useLayoutEffect(()=>{navigation.setOptions({
    title:'Home',headerStyle:{backgroundColor:NAVY},headerTintColor:'#fff',
    headerRight:()=>(
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <TouchableOpacity onPress={()=>navigation.navigate('Messages')} style={{paddingHorizontal:8}}>
          <Ionicons name="chatbubble-outline" size={22} color="#fff"/></TouchableOpacity>
        <TouchableOpacity onPress={()=>navigation.navigate('Notifications')} style={{paddingHorizontal:8}}>
          <Ionicons name="notifications-outline" size={22} color="#fff"/></TouchableOpacity>
        <TouchableOpacity onPress={()=>navigation.navigate('Settings')} style={{paddingLeft:8}}>
          <Ionicons name="settings-outline" size={22} color="#fff"/></TouchableOpacity>
      </View>)});},[navigation]);

  const load=async()=>{try{
    const {data:u}=await http.get<User>('/users/me'); setUser(u);
    const {data:my}=await http.get<Shift[]>('/shifts/myshifts');
    const confirmed=my.filter(s=>s.status==='assigned').length;
    const pending=my.filter(s=>s.status==='applied').length;
    const tStr=new Date().toDateString();
    const today=my.filter(s=>s.status==='assigned' && new Date(s.date).toDateString()===tStr);
    const upcoming=my.filter(s=>s.status==='assigned' && new Date(s.date)>new Date());
    const earnings=today.reduce((sum,s)=>!s.startTime||!s.endTime||!s.payRate?sum:sum+(minutesBetween(s.startTime,s.endTime)/60)*s.payRate,0);
    setMetrics({confirmed,pending,earnings,rating:u?.rating??0}); setTodayShifts(today); setUpcomingShifts(upcoming);
  }catch(e){console.error('home load failed',e);}};

  useEffect(()=>{load();},[]);
  useFocusEffect(useCallback(()=>{load();},[]));
  const onRefresh=async()=>{setRefreshing(true);await load();setRefreshing(false);};

  return(<SafeAreaView style={styles.safe}><StatusBar barStyle="light-content"/>
    <ScrollView contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
      <View style={styles.canvas}>
        <View style={styles.heading}><Text style={styles.h1}>Welcome back, {user?.name||'Guard'}!</Text>
          <Text style={styles.h2}>Here’s your dashboard</Text></View>

        <View style={styles.grid}>
          <StatCard icon={<Ionicons name="calendar-outline" size={18} color={BLUE}/>}
            label="Confirmed shifts" value={metrics.confirmed} extraStyle={styles.tintBlue}/>
          <StatCard icon={<Ionicons name="time-outline" size={18} color="#C99A06"/>}
            label="Pending Applications" value={metrics.pending} extraStyle={styles.tintYellow}/>
          <StatCard icon={<Feather name="dollar-sign" size={18} color={GREEN}/>}
            label="Today’s Earning" value={`$${metrics.earnings.toFixed(0)}`} extraStyle={styles.tintGreen}/>
          <StatCard icon={<MaterialCommunityIcons name="trending-up" size={18} color="#7C5CFC"/>}
            label="Current Rating" value={metrics.rating} extraStyle={styles.tintPurple}/>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <Feather name="calendar" size={16} color={MUTED}/><Text style={styles.cardHeadTxt}>Today’s Schedule</Text>
            </View>
          </View>
          {todayShifts.length? todayShifts.map((s,i)=>(
            <RowItem key={`${s.title}-${i}`} title={s.title}
              time={`${s.startTime??'--:--'} – ${s.endTime??'--:--'}`} amount={moneyForShift(s)} highlight/>
          )): <Text style={styles.emptyText}>No shifts scheduled for today</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <Feather name="clock" size={16} color={MUTED}/><Text style={styles.cardHeadTxt}>Upcoming Shifts</Text>
            </View>
            <TouchableOpacity onPress={()=>navigation.navigate('Shifts')}><Text style={styles.viewAll}>View All ›</Text></TouchableOpacity>
          </View>
          {upcomingShifts.length? upcomingShifts.slice(0,2).map((s,i)=>(
            <RowItem key={`${s.title}-${i}`} title={s.title}
              time={`${new Date(s.date).toLocaleDateString()}, ${s.startTime??'--:--'} – ${s.endTime??'--:--'}`}
              amount={moneyForShift(s)}/>
          )): <Text style={styles.emptyText}>No upcoming shifts</Text>}
        </View>

        <View style={styles.spacer}/>
      </View>
    </ScrollView></SafeAreaView>);
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FFFFFF'}, scroll:{alignItems:'center'}, canvas:{width:CANVAS},
  heading:{alignItems:'center',paddingHorizontal:P,paddingTop:18},
  h1:{fontSize:28,fontWeight:'800',color:'#0F172A',letterSpacing:0.2,textAlign:'center'},
  h2:{fontSize:14,color:'#6B7280',marginTop:6,textAlign:'center'},
  grid:{paddingHorizontal:P,marginTop:18,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},
  statCard:{width:(CANVAS-P*2-12)/2,borderRadius:22,padding:16,marginBottom:12},
  statTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  statIcon:{width:36,height:36,borderRadius:12,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center',
    shadowColor:'#000',shadowOpacity:0.06,shadowOffset:{width:0,height:2},shadowRadius:6,elevation:2},
  statValue:{fontSize:20,fontWeight:'800',color:'#0F172A'}, statLabel:{marginTop:10,fontSize:12,color:'#6B7280'},
  tintBlue:{backgroundColor:'#EEF2FF'}, tintYellow:{backgroundColor:'#FFF4C8'},
  tintGreen:{backgroundColor:'#EAF7EF'}, tintPurple:{backgroundColor:'#ECEBFF'},
  card:{marginHorizontal:P,marginTop:18,backgroundColor:'#FFFFFF',borderRadius:24,padding:16,borderWidth:1,borderColor:BORDER,
    shadowColor:'#000',shadowOpacity:0.12,shadowOffset:{width:0,height:8},shadowRadius:16,elevation:8},
  cardHead:{paddingHorizontal:4,paddingVertical:2,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  cardHeadLeft:{flexDirection:'row',alignItems:'center'}, cardHeadTxt:{marginLeft:8,fontSize:16,color:MUTED,fontWeight:'700'},
  rowItem:{borderWidth:1,borderColor:BORDER,borderRadius:18,padding:16,marginTop:12,backgroundColor:'#FFFFFF',flexDirection:'row',alignItems:'center'},
  rowItemHL:{backgroundColor:'#EAF7EF',borderColor:'#D4F0DC'}, rowLeft:{flex:1},
  rowTitle:{fontSize:18,fontWeight:'800',color:'#0F172A'}, rowSub:{fontSize:13,color:'#6B7280',marginTop:6},
  rowAmt:{fontSize:16,fontWeight:'900',color:GREEN,paddingLeft:10},
  emptyText:{color:MUTED,fontSize:14,marginTop:6}, viewAll:{fontSize:15,color:'#3E63DD',fontWeight:'700'},
  spacer:{height:88},
});
