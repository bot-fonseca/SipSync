import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../contexts/ThemeContext';
import { getSettings, upsertSettings } from '../../lib/waterService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WATER_FACTS = [
  "Your brain is 73% water. Drink up to keep it fueled!",
  "Hydration boosts your energy levels and fights fatigue.",
  "Water acts as a shock absorber for your joints and spine.",
  "Drinking water helps keep your skin glowing and healthy.",
  "Staying hydrated helps your heart pump blood more easily.",
  "A glass of water can often help prevent a headache!",
  "Cold water can temporarily boost your metabolism.",
];

const TIMES = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
  "07:00 PM", "08:00 PM", "09:00 PM", "09:49 PM", "10:00 PM", "11:00 PM"
];

const INTERVAL_OPTIONS = [1, 2, 3, 4, 6];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (hours === 12) hours = 0;
  if (modifier === 'PM') hours += 12;
  return { hours, minutes };
}

async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please enable notifications in your device settings to receive water reminders.',
    );
    return false;
  }
  return true;
}

async function scheduleAllNotifications(
  intervalEnabled: boolean,
  intervalHours: number,
  intervalStart: string,
  intervalEnd: string,
  specificTimes: string[],
) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // Agenda os "Strict Reminders" — repetem todos os dias
  // Strict reminders
  for (const timeStr of specificTimes) {
    const { hours, minutes } = parseTime(timeStr);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Time to Hydrate!',
        body: 'This is your reminder to drink a glass of water.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  }

  // Intervalos
  if (intervalEnabled) {
    const start = parseTime(intervalStart);
    const end = parseTime(intervalEnd);
    let currentHour = start.hours;

    while (currentHour <= end.hours) {
      const alreadyExists = specificTimes.some(
        t => parseTime(t).hours === currentHour
      );
      if (!alreadyExists) {
        const fact = WATER_FACTS[Math.floor(Math.random() * WATER_FACTS.length)];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💡 Did you know?',
            body: fact,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: currentHour,
            minute: 0,
          },
        });
      }
      currentHour += intervalHours;
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`Scheduled ${scheduled.length} notifications.`);
}

export default function AlarmScreen() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#E0E7FF',
    iconBg: isDark ? '#2C2C2E' : '#E0E7FF',
  };

  const [intervalEnabled, setIntervalEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState(3);
  const [intervalStart, setIntervalStart] = useState("09:00 AM");
  const [intervalEnd, setIntervalEnd] = useState("11:00 PM");
  const [specificTimes, setSpecificTimes] = useState<string[]>(["10:00 AM", "08:00 PM"]);
  const [nextNotification, setNextNotification] = useState<string | null>(null);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | 'specific'>('start');

  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        await requestPermissions();
        const settings = await getSettings();
        const al = settings?.alarm_config ?? {};

        const iEnabled = al.intervalEnabled ?? false;
        const iHours = al.intervalHours ?? 3;
        const iStart = al.intervalStart ?? "09:00 AM";
        const iEnd = al.intervalEnd ?? "11:00 PM";
        const sTimes = al.specificTimes ?? ["10:00 AM", "08:00 PM"];

        setIntervalEnabled(iEnabled);
        setIntervalHours(iHours);
        setIntervalStart(iStart);
        setIntervalEnd(iEnd);
        setSpecificTimes(sTimes);

        await updateNextNotification();
      }
      loadData();
    }, [])
  );

  async function updateNextNotification() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) {
      setNextNotification(null);
      return;
    }

    const now = new Date();
    const today = new Date();

    // Encontra a próxima notificação hoje
    let nextTime: Date | null = null;
    for (const notif of scheduled) {
      const trigger = notif.trigger as any;
      if (trigger?.hour !== undefined) {
        const candidate = new Date(today);
        candidate.setHours(trigger.hour, trigger.minute ?? 0, 0, 0);
        if (candidate > now) {
          if (!nextTime || candidate < nextTime) nextTime = candidate;
        }
      }
    }

    if (nextTime) {
      const hours = nextTime.getHours();
      const minutes = nextTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayH = hours % 12 === 0 ? 12 : hours % 12;
      const displayM = minutes.toString().padStart(2, '0');
      setNextNotification(`${displayH}:${displayM} ${ampm}`);
    } else {
      setNextNotification(null);
    }
  }

  async function saveAndSchedule(
    iEnabled: boolean, iHours: number, iStart: string, iEnd: string, sTimes: string[]
  ) {
    await upsertSettings({
      alarm_config: {
        intervalEnabled: iEnabled,
        intervalHours: iHours,
        intervalStart: iStart,
        intervalEnd: iEnd,
        specificTimes: sTimes,
      }
    });
    await scheduleAllNotifications(iEnabled, iHours, iStart, iEnd, sTimes);
    await updateNextNotification();
  }

  const toggleInterval = (val: boolean) => {
    setIntervalEnabled(val);
    saveAndSchedule(val, intervalHours, intervalStart, intervalEnd, specificTimes);
  };

  const removeSpecificTime = (timeToRemove: string) => {
    const updated = specificTimes.filter(t => t !== timeToRemove);
    setSpecificTimes(updated);
    saveAndSchedule(intervalEnabled, intervalHours, intervalStart, intervalEnd, updated);
  };

  const handleTimeSelect = (selectedTime: string) => {
    setShowTimeModal(false);
    if (timePickerTarget === 'start') {
      setIntervalStart(selectedTime);
      saveAndSchedule(intervalEnabled, intervalHours, selectedTime, intervalEnd, specificTimes);
    } else if (timePickerTarget === 'end') {
      setIntervalEnd(selectedTime);
      saveAndSchedule(intervalEnabled, intervalHours, intervalStart, selectedTime, specificTimes);
    } else {
      if (!specificTimes.includes(selectedTime)) {
        const updated = [...specificTimes, selectedTime].sort(
          (a, b) => parseTime(a).hours - parseTime(b).hours
        );
        setSpecificTimes(updated);
        saveAndSchedule(intervalEnabled, intervalHours, intervalStart, intervalEnd, updated);
      }
    }
  };

  const handleIntervalSelect = (hours: number) => {
    setShowIntervalModal(false);
    setIntervalHours(hours);
    saveAndSchedule(intervalEnabled, hours, intervalStart, intervalEnd, specificTimes);
  };

  // Lista visual de todos os alarmes activos
  const allAlarms: { time: string; isStrict: boolean }[] = [];
  specificTimes.forEach(t => allAlarms.push({ time: t, isStrict: true }));

  if (intervalEnabled) {
    let currentHour = parseTime(intervalStart).hours;
    const endHour = parseTime(intervalEnd).hours;
    while (currentHour <= endHour) {
      const isStrict = specificTimes.some(t => parseTime(t).hours === currentHour);
      if (!isStrict) {
        const ampm = currentHour >= 12 ? 'PM' : 'AM';
        const displayH = currentHour % 12 === 0 ? 12 : currentHour % 12;
        const timeStr = `${displayH.toString().padStart(2, '0')}:00 ${ampm}`;
        allAlarms.push({ time: timeStr, isStrict: false });
      }
      currentHour += intervalHours;
    }
  }

  allAlarms.sort((a, b) => parseTime(a.time).hours - parseTime(b.time).hours);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reminders</Text>
      </View>

      {/* PRÓXIMA NOTIFICAÇÃO */}
      {nextNotification && (
        <View style={[styles.nextCard, { backgroundColor: theme.card }]}>
          <View style={[styles.nextIconBox, { backgroundColor: theme.iconBg }]}>
            <Ionicons name="time-outline" size={22} color="#7B61FF" />
          </View>
          <View>
            <Text style={[styles.nextLabel, { color: theme.subtext }]}>Next reminder</Text>
            <Text style={[styles.nextTime, { color: theme.text }]}>{nextNotification}</Text>
          </View>
        </View>
      )}

      {/* SMART INTERVALS */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Smart Intervals</Text>
            <Text style={[styles.cardSub, { color: theme.subtext }]}>
              Fun facts every {intervalHours}h between {intervalStart} and {intervalEnd}
            </Text>
          </View>
          <Switch
            value={intervalEnabled}
            onValueChange={toggleInterval}
            trackColor={{ false: theme.border, true: '#7B61FF' }}
            thumbColor="#FFF"
          />
        </View>

        {intervalEnabled && (
          <View style={styles.intervalControls}>
            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: theme.iconBg }]}
              onPress={() => { setTimePickerTarget('start'); setShowTimeModal(true); }}
            >
              <Text style={[styles.timeBtnText, { color: theme.text }]}>Start: {intervalStart}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: theme.iconBg }]}
              onPress={() => { setTimePickerTarget('end'); setShowTimeModal(true); }}
            >
              <Text style={[styles.timeBtnText, { color: theme.text }]}>End: {intervalEnd}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: theme.iconBg }]}
              onPress={() => setShowIntervalModal(true)}
            >
              <Text style={[styles.timeBtnText, { color: theme.text }]}>Every: {intervalHours}h</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* STRICT REMINDERS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Strict Reminders</Text>
        <TouchableOpacity onPress={() => { setTimePickerTarget('specific'); setShowTimeModal(true); }}>
          <Ionicons name="add-circle" size={28} color="#7B61FF" />
        </TouchableOpacity>
      </View>

      {allAlarms.map((alarm, idx) => (
        <View key={idx} style={[styles.recordCard, { backgroundColor: theme.card }]}>
          <View style={[styles.iconBox, { backgroundColor: alarm.isStrict ? '#FFE5E5' : theme.iconBg }]}>
            <Ionicons
              name={alarm.isStrict ? "alert-circle" : "bulb"}
              size={24}
              color={alarm.isStrict ? "#FF4B4B" : "#7B61FF"}
            />
          </View>
          <View style={styles.recordInfo}>
            <Text style={[styles.recordTime, { color: theme.text }]}>{alarm.time}</Text>
            <Text style={[styles.recordSub, { color: theme.subtext }]}>
              {alarm.isStrict ? 'Strict Reminder' : 'Fun Fact Interval'}
            </Text>
          </View>
          {alarm.isStrict && (
            <TouchableOpacity onPress={() => removeSpecificTime(alarm.time)}>
              <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* TIME PICKER MODAL */}
      <Modal visible={showTimeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Time</Text>
            <View style={styles.timeListWrapper}>
              <FlatList
                data={TIMES}
                keyExtractor={item => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, { borderBottomColor: theme.border }]}
                    onPress={() => handleTimeSelect(item)}
                  >
                    <Text style={[styles.modalOptionText, { color: theme.text }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTimeModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* INTERVAL PICKER MODAL */}
      <Modal visible={showIntervalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Remind every...</Text>
            {INTERVAL_OPTIONS.map(hours => (
              <TouchableOpacity
                key={hours}
                style={[styles.modalOption, { borderBottomColor: theme.border }]}
                onPress={() => handleIntervalSelect(hours)}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>
                  {hours} {hours === 1 ? 'hour' : 'hours'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowIntervalModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  nextCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  nextIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  nextLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  nextTime: { fontSize: 20, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 20, marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { fontSize: 13 },
  intervalControls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 8 },
  timeBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  timeBtnText: { fontWeight: '600', fontSize: 12 },
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
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 },
});