import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, FlatList, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import notifee, { TriggerType, AndroidImportance, TimestampTrigger } from '@notifee/react-native';

const WATER_FACTS = [
  "💧 Did you know? Your brain is 73% water. Drink up to keep it fueled!",
  "⚡ Hydration boosts your energy levels and fights fatigue.",
  "🦴 Water acts as a shock absorber for your joints and spine.",
  "✨ Drinking water helps keep your skin looking glowing and healthy.",
  "❤️ Staying hydrated helps your heart pump blood more easily.",
  "🤕 A glass of water can often help prevent or cure a headache!",
  "🚀 Cold water can temporarily boost your metabolism."
];

const TIMES = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", 
  "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
];

function parseTime(timeStr: string) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (hours === 12) hours = 0;
  if (modifier === 'PM') hours += 12;
  return { hours, minutes };
}

export default function AlarmScreen() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#E0E7FF',
    iconBg: isDark ? '#2C2C2E' : '#E0E7FF',
  };

  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [unitLabel, setUnitLabel] = useState('ml');

  const [intervalEnabled, setIntervalEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState(3);
  const [intervalStart, setIntervalStart] = useState("09:00 AM");
  const [intervalEnd, setIntervalEnd] = useState("11:00 PM");
  const [specificTimes, setSpecificTimes] = useState<string[]>(["10:00 AM", "08:00 PM"]);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | 'specific'>('start');

  const hasToppedUp = useRef(false);

  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        const savedTheme = await AsyncStorage.getItem('@dark_mode');
        if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));

        let metricPref = true;
        try {
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) metricPref = JSON.parse(savedUnit);
        } catch (e) {}
        setUnitLabel(metricPref ? 'ml' : 'oz');

        const todayStr = new Date().toISOString().split('T')[0];
        try {
          const savedIntake = await AsyncStorage.getItem('@daily_intake');
          if (savedIntake !== null) {
            const parsedIntake = JSON.parse(savedIntake);
            if (parsedIntake.date === todayStr) {
              setCurrentIntake(parsedIntake.amount);
              setDailyTarget(parsedIntake.target || 2000);
            }
          }
        } catch (e) {}

        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          const al = user.user_metadata.smart_alarms || {};
          setIntervalEnabled(al.intervalEnabled ?? false);
          setIntervalHours(al.intervalHours ?? 3);
          setIntervalStart(al.intervalStart ?? "09:00 AM");
          setIntervalEnd(al.intervalEnd ?? "11:00 PM");
          setSpecificTimes(al.specificTimes ?? ["10:00 AM", "08:00 PM"]);

          if (!hasToppedUp.current) {
            hasToppedUp.current = true;
            scheduleAllAlarms(
              al.intervalEnabled ?? false,
              al.intervalHours ?? 3,
              al.intervalStart ?? "09:00 AM",
              al.intervalEnd ?? "11:00 PM",
              al.specificTimes ?? ["10:00 AM", "08:00 PM"]
            );
          }
        }
      }
      loadData();
    }, [])
  );

  // --- THE NEW NOTIFEE ENGINE ---
  async function scheduleAllAlarms(
    iEnabled: boolean, iHours: number, iStart: string, iEnd: string, sTimes: string[]
  ) {
    try {
      // 1. Ask for exact permission
      await notifee.requestPermission();

      // 2. Wipe every ghost alarm from Android's memory instantly
      await notifee.cancelAllNotifications();

      // 3. Create the robust Android channel
      const channelId = await notifee.createChannel({
        id: 'water-reminders',
        name: 'Water Reminders',
        importance: AndroidImportance.HIGH,
      });

      const now = new Date();
      const futureAlarms = [];
      const dailyTimes = []; 

      // Gather Strict Reminders
      for (const timeStr of sTimes) {
        dailyTimes.push({ ...parseTime(timeStr), isStrict: true });
      }

      // Gather Intervals
      if (iEnabled) {
        const start = parseTime(iStart);
        const end = parseTime(iEnd);
        let cH = start.hours;
        while (cH <= end.hours) {
          if (!sTimes.some(st => parseTime(st).hours === cH)) {
            dailyTimes.push({ hours: cH, minutes: 0, isStrict: false });
          }
          cH += iHours;
        }
      }

      // Project into the next 14 days
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        for (const dt of dailyTimes) {
          const alarmDate = new Date();
          alarmDate.setDate(now.getDate() + dayOffset);
          alarmDate.setHours(dt.hours, dt.minutes, 0, 0);

          if (alarmDate > now) {
            futureAlarms.push({ date: alarmDate, isStrict: dt.isStrict });
          }
        }
      }

      futureAlarms.sort((a, b) => a.date.getTime() - b.date.getTime());
      const cappedAlarms = futureAlarms.slice(0, 50);

      // Schedule them securely with Notifee
      for (const alarm of cappedAlarms) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: alarm.date.getTime(),
        };

        const title = alarm.isStrict ? "💧 Time to Hydrate!" : "Did you know? 🤔";
        const body = alarm.isStrict 
          ? "This is your reminder to drink a glass of water." 
          : WATER_FACTS[Math.floor(Math.random() * WATER_FACTS.length)];

        await notifee.createTriggerNotification({
          title,
          body,
          android: {
            channelId,
            pressAction: { id: 'default' },
          },
        }, trigger);
      }

      console.log(`Notifee scheduled ${cappedAlarms.length} perfectly timed alarms.`);

    } catch (error) {
      console.log("Error scheduling Notifee:", error);
    }
  }

  async function saveSettings(
    newEnabled: boolean, newHours: number, newStart: string, newEnd: string, newTimes: string[]
  ) {
    const payload = { intervalEnabled: newEnabled, intervalHours: newHours, intervalStart: newStart, intervalEnd: newEnd, specificTimes: newTimes };
    await supabase.auth.updateUser({ data: { smart_alarms: payload } });
    await scheduleAllAlarms(newEnabled, newHours, newStart, newEnd, newTimes);
  }

  const toggleInterval = (val: boolean) => {
    setIntervalEnabled(val);
    saveSettings(val, intervalHours, intervalStart, intervalEnd, specificTimes);
  };

  const removeSpecificTime = (timeToRemove: string) => {
    const updated = specificTimes.filter(t => t !== timeToRemove);
    setSpecificTimes(updated);
    saveSettings(intervalEnabled, intervalHours, intervalStart, intervalEnd, updated);
  };

  const handleTimeSelect = (selectedTime: string) => {
    setShowTimeModal(false);
    if (timePickerTarget === 'start') {
      setIntervalStart(selectedTime);
      saveSettings(intervalEnabled, intervalHours, selectedTime, intervalEnd, specificTimes);
    } else if (timePickerTarget === 'end') {
      setIntervalEnd(selectedTime);
      saveSettings(intervalEnabled, intervalHours, intervalStart, selectedTime, specificTimes);
    } else if (timePickerTarget === 'specific') {
      if (!specificTimes.includes(selectedTime)) {
        const updated = [...specificTimes, selectedTime].sort((a, b) => parseTime(a).hours - parseTime(b).hours);
        setSpecificTimes(updated);
        saveSettings(intervalEnabled, intervalHours, intervalStart, intervalEnd, updated);
      }
    }
  };

  const allUpcomingAlarms = [...specificTimes];
  if (intervalEnabled) {
    let cH = parseTime(intervalStart).hours;
    let eH = parseTime(intervalEnd).hours;
    while(cH <= eH) {
      const timeString = `${cH > 12 ? cH - 12 : (cH === 0 ? 12 : cH)}:00 ${cH >= 12 ? 'PM' : 'AM'}`;
      const finalStr = timeString.length === 7 ? `0${timeString}` : timeString;
      if (!allUpcomingAlarms.includes(finalStr)) allUpcomingAlarms.push(finalStr);
      cH += intervalHours;
    }
  }
  allUpcomingAlarms.sort((a, b) => parseTime(a).hours - parseTime(b).hours);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reminders</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Smart Intervals</Text>
            <Text style={[styles.cardSub, { color: theme.subtext }]}>Receive fun facts every {intervalHours} hours.</Text>
          </View>
          <Switch value={intervalEnabled} onValueChange={toggleInterval} trackColor={{ false: theme.border, true: '#7B61FF' }} thumbColor="#FFF" />
        </View>

        {intervalEnabled && (
          <View style={styles.intervalControls}>
            <TouchableOpacity style={[styles.timeBtn, { backgroundColor: theme.iconBg }]} onPress={() => { setTimePickerTarget('start'); setShowTimeModal(true); }}>
              <Text style={[styles.timeBtnText, { color: theme.text }]}>Start: {intervalStart}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timeBtn, { backgroundColor: theme.iconBg }]} onPress={() => { setTimePickerTarget('end'); setShowTimeModal(true); }}>
              <Text style={[styles.timeBtnText, { color: theme.text }]}>End: {intervalEnd}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Strict Reminders</Text>
        <TouchableOpacity onPress={() => { setTimePickerTarget('specific'); setShowTimeModal(true); }}>
          <Ionicons name="add-circle" size={28} color="#7B61FF" />
        </TouchableOpacity>
      </View>

      {allUpcomingAlarms.map((time, idx) => {
        const isStrict = specificTimes.includes(time);
        return (
          <View key={idx} style={[styles.recordCard, { backgroundColor: theme.card }]}>
            <View style={[styles.iconBox, { backgroundColor: isStrict ? '#FFE5E5' : theme.iconBg }]}>
              <Ionicons name={isStrict ? "alert-circle" : "bulb"} size={24} color={isStrict ? "#FF4B4B" : "#7B61FF"} />
            </View>
            <View style={styles.recordInfo}>
              <Text style={[styles.recordTime, { color: theme.text }]}>{time}</Text>
              <Text style={[styles.recordSub, { color: theme.subtext }]}>{isStrict ? 'Strict Reminder' : 'Fun Fact Interval'}</Text>
            </View>
            {isStrict && (
              <TouchableOpacity onPress={() => removeSpecificTime(time)}>
                <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Modal visible={showTimeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Time</Text>
            <View style={styles.timeListWrapper}>
              <FlatList 
                data={TIMES}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => handleTimeSelect(item)}>
                    <Text style={[styles.modalOptionText, { color: theme.text }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTimeModal(false)}><Text style={styles.modalCloseText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  gaugeContainer: { alignItems: 'center', marginBottom: 30 },
  outerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 12, justifyContent: 'center', alignItems: 'center' },
  gaugeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  card: { padding: 20, borderRadius: 20, marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 13 },
  intervalControls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  timeBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  timeBtnText: { fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  recordCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, marginLeft: 15 },
  recordTime: { fontWeight: 'bold', fontSize: 16 },
  recordSub: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  timeListWrapper: { maxHeight: 300 }, 
  modalOption: { paddingVertical: 18, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 18, textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});