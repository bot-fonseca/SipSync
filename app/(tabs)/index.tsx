import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TextInput, Alert, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getTodayTotal,
  addWaterLog,
  deleteLastLog,
  getSettings,
  upsertSettings,
  convertAmount,
  ozToMl,
  addToTotalWater,
  getTotalWater,
} from '../../lib/waterService';

const TROPICAL_COUNTRIES = ["Brazil", "Colombia", "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "Fiji", "Ghana", "Haiti", "Honduras", "Indonesia", "Ivory Coast", "Jamaica", "Kenya", "Malaysia", "Maldives", "Nicaragua", "Panama", "Papua New Guinea", "Peru", "Philippines", "Puerto Rico", "Senegal", "Singapore", "Sri Lanka", "Thailand", "Venezuela", "Vietnam"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function calculateWaterIntakeMl(meta: any): number {
  let age = 25;
  if (meta.dob) {
    const dobDate = new Date(meta.dob);
    if (!isNaN(dobDate.getTime())) {
      age = Math.abs(new Date(Date.now() - dobDate.getTime()).getUTCFullYear() - 1970);
    }
  }

  let resultOz = 0;
  if (age < 14) {
    if (age < 1) resultOz = 6;
    else if (age < 4) resultOz = 32;
    else if (age < 9) resultOz = 40;
    else resultOz = 60;
  } else {
    const weightLbs = parseFloat(meta.weight || '70') * 2.20462;
    resultOz = meta.gender === 'M' ? weightLbs * 0.67 : weightLbs * 0.50;
    const activity = meta.exercise || '';
    if (activity.includes("Light")) resultOz += 6;
    else if (activity.includes("Moderate")) resultOz += 12;
    else if (activity.includes("High")) resultOz += 24;
    else if (activity.includes("Extreme")) resultOz += 32;
  }

  if (TROPICAL_COUNTRIES.includes(meta.country || '')) resultOz += 12;
  return Math.round(resultOz * 29.5735);
}

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    tankBg: isDark ? '#1E1E1E' : '#FFFFFF',
    tankBorder: isDark ? '#333333' : '#E0E7FF',
    avatarBg: isDark ? '#2C2C2E' : '#E0E7FF',
    inputBg: isDark ? '#2C2C2E' : '#F0F4FF',
    iconBtn: isDark ? '#2C2C2E' : '#FFFFFF',
    progressTextBg: isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.6)',
  };

  const [userName, setUserName] = useState('Loading...');
  const [dailyTargetMl, setDailyTargetMl] = useState(2000);
  const [isMetric, setIsMetric] = useState(true);
  const [unitLabel, setUnitLabel] = useState('ml');
  const [currentIntakeMl, setCurrentIntakeMl] = useState(0);
  const [customBottleSizeMl, setCustomBottleSizeMl] = useState(500);
  const [showBottleModal, setShowBottleModal] = useState(false);
  const [bottleInput, setBottleInput] = useState('');

  const waterHeight = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      async function loadDashboardData() {
        // 2. Dados do utilizador (perfil)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const meta = user.user_metadata ?? {};
        setUserName(meta.userName || user.email?.split('@')[0] || 'User');

        // 3. Settings da BD
        const settings = await getSettings();
        const metric = settings?.use_metric ?? true;
        setIsMetric(metric);
        setUnitLabel(metric ? 'ml' : 'oz');

        // 4. Target diário — calcula com base no perfil
        let targetMl = settings?.daily_target_ml ?? calculateWaterIntakeMl(meta);
        setDailyTargetMl(targetMl);

        // 5. Tamanho da garrafa
        setCustomBottleSizeMl(settings?.bottle_size_ml ?? 500);

        // 6. Intake de hoje (soma dos logs)
        const totalMl = await getTodayTotal();
        setCurrentIntakeMl(totalMl);

        // Guarda o target calculado nas settings se ainda não existir
        if (!settings) {
          await upsertSettings({ daily_target_ml: targetMl, use_metric: metric });
        }
      }
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    const percentage = dailyTargetMl > 0
      ? Math.min((currentIntakeMl / dailyTargetMl) * 100, 100)
      : 0;
    Animated.spring(waterHeight, {
      toValue: percentage,
      bounciness: 10,
      useNativeDriver: false,
    }).start();
  }, [currentIntakeMl, dailyTargetMl]);

  // Adiciona água (guarda sempre em ml)
  async function handleAddWater(displayAmount: number) {
    const amountMl = isMetric ? displayAmount : ozToMl(displayAmount);
    const log = await addWaterLog(amountMl);
    if (log) {
      setCurrentIntakeMl(prev => prev + amountMl);
      await addToTotalWater(amountMl); // ← linha nova
    }
}

  // Desfaz o ÚLTIMO registo (não apaga tudo)
  async function handleUndo() {
    Alert.alert(
      'Undo last drink?',
      'This will remove your last water entry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo', style: 'destructive',
          onPress: async () => {
            // Guarda o total antes de apagar para saber quanto subtrair
            const logsBefore = await getTodayTotal();
            const success = await deleteLastLog();
            if (success) {
              const newTotal = await getTodayTotal();
              const difference = logsBefore - newTotal; // quanto foi removido
              setCurrentIntakeMl(newTotal);
              await addToTotalWater(-difference); // subtrai do total acumulado
            }
          }
        }
      ]
    );
  }

  async function saveBottleSize() {
    const sizeDisplay = parseInt(bottleInput);
    if (isNaN(sizeDisplay) || sizeDisplay <= 0) {
      return Alert.alert("Invalid Amount", "Please enter a valid number.");
    }
    const sizeMl = isMetric ? sizeDisplay : ozToMl(sizeDisplay);
    setCustomBottleSizeMl(sizeMl);
    setShowBottleModal(false);
    setBottleInput('');
    await upsertSettings({ bottle_size_ml: sizeMl });
  }

  const animatedWaterStyle = {
    height: waterHeight.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
  };

  const currentIntakeDisplay = convertAmount(currentIntakeMl, isMetric);
  const targetDisplay = convertAmount(dailyTargetMl, isMetric);
  const bottleDisplay = convertAmount(customBottleSizeMl, isMetric);
  const glassDisplay = isMetric ? 250 : 8;
  const progressPercentage = dailyTargetMl > 0
    ? Math.min(Math.round((currentIntakeMl / dailyTargetMl) * 100), 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.avatarBg }]}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.greetingBox}>
            <Text style={[styles.greeting, { color: theme.subtext }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: theme.text }]}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.iconBtn }]}
          onPress={handleUndo}
        >
          <Ionicons name="arrow-undo-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* TARGET CARD */}
      <View style={styles.targetCard}>
        <View style={styles.targetTextContainer}>
          <Text style={styles.targetTitle}>Daily Drink Target</Text>
          <Text style={styles.targetSubtitle}>Based on your body & climate</Text>
        </View>
        <View style={styles.targetAmountContainer}>
          <Text style={styles.targetAmount}>{targetDisplay}</Text>
          <Text style={styles.targetUnit}>{unitLabel}</Text>
        </View>
      </View>

      {/* WATER TANK */}
      <View style={styles.tankContainer}>
        <View style={[styles.circleMask, { backgroundColor: theme.tankBg, borderColor: theme.tankBorder }]}>
          <Animated.View style={[styles.waterFill, animatedWaterStyle]} />
          <View style={styles.tankTextOverlay}>
            <Text style={[styles.progressPercentage, { color: theme.text }]}>{progressPercentage}%</Text>
            <Text style={[styles.progressAmount, { color: theme.text, backgroundColor: theme.progressTextBg }]}>
              {currentIntakeDisplay} / {targetDisplay} {unitLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddWater(glassDisplay)}>
          <Ionicons name="water" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>+ {glassDisplay} {unitLabel}</Text>
        </TouchableOpacity>

        <View style={styles.bottleButtonWrapper}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#4D8AF0', width: '100%' }]}
            onPress={() => handleAddWater(bottleDisplay)}
          >
            <Ionicons name="pint" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>+ {bottleDisplay} {unitLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBottleIcon, { backgroundColor: theme.iconBtn }]}
            onPress={() => setShowBottleModal(true)}
          >
            <Ionicons name="settings-sharp" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTLE MODAL */}
      <Modal visible={showBottleModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Set Bottle Size</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
              Enter the exact size of your favorite water bottle.
            </Text>
            <View style={[styles.modalInputWrapper, { backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder={`e.g. ${isMetric ? '750' : '32'}`}
                placeholderTextColor={theme.subtext}
                value={bottleInput}
                onChangeText={setBottleInput}
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.modalInputUnit}>{unitLabel}</Text>
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FFE5E5' }]}
                onPress={() => setShowBottleModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#FF4B4B' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#7B61FF' }]}
                onPress={saveBottleSize}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7B61FF' },
  greetingBox: { justifyContent: 'center' },
  greeting: { fontSize: 14, marginBottom: 2 },
  name: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  targetCard: { backgroundColor: '#7B61FF', borderRadius: 20, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowColor: '#7B61FF', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, marginBottom: 40 },
  targetTextContainer: { flex: 1, paddingRight: 10 },
  targetTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  targetSubtitle: { color: '#E0E7FF', fontSize: 13 },
  targetAmountContainer: { alignItems: 'flex-end' },
  targetAmount: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  targetUnit: { color: '#E0E7FF', fontSize: 16, fontWeight: '600', marginTop: -5 },
  tankContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  circleMask: { width: 220, height: 220, borderRadius: 110, borderWidth: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#43C6FF' },
  tankTextOverlay: { alignItems: 'center', zIndex: 10 },
  progressPercentage: { fontSize: 42, fontWeight: 'bold' },
  progressAmount: { fontSize: 16, fontWeight: '600', marginTop: 5, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: { flex: 1, backgroundColor: '#7B61FF', paddingVertical: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, elevation: 3, shadowColor: '#7B61FF', shadowOpacity: 0.3, shadowRadius: 5 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  bottleButtonWrapper: { flex: 1, position: 'relative', marginHorizontal: 5 },
  editBottleIcon: { position: 'absolute', top: -5, right: -5, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 25, padding: 25, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, marginBottom: 25, width: '100%' },
  modalInput: { flex: 1, paddingVertical: 15, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalInputUnit: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginLeft: 10 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});