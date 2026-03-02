import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TextInput, Alert, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TROPICAL_COUNTRIES = ["Brazil", "Colombia", "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "Fiji", "Ghana", "Haiti", "Honduras", "Indonesia", "Ivory Coast", "Jamaica", "Kenya", "Malaysia", "Maldives", "Nicaragua", "Panama", "Papua New Guinea", "Peru", "Philippines", "Puerto Rico", "Senegal", "Singapore", "Sri Lanka", "Thailand", "Venezuela", "Vietnam"];

export default function HomeScreen() {
  const router = useRouter();
  
  // --- NEW: DARK MODE LISTENER ---
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  // Dynamic Theme Colors
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
  const [dailyTarget, setDailyTarget] = useState(0);
  const [unitLabel, setUnitLabel] = useState('ml');
  const [isMetric, setIsMetric] = useState(true);

  const [currentIntake, setCurrentIntake] = useState(0);
  const waterHeight = useRef(new Animated.Value(0)).current; 

  const [customBottleSize, setCustomBottleSize] = useState(500);
  const [showBottleModal, setShowBottleModal] = useState(false);
  const [bottleInput, setBottleInput] = useState('');

  const getTodayString = () => new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      async function loadDashboardData() {
        let metricPref = true;
        try {
          const savedTheme = await AsyncStorage.getItem('@dark_mode');
          if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) metricPref = JSON.parse(savedUnit);
        } catch (e) { console.log("Failed to load unit settings"); }
        setIsMetric(metricPref);
        setUnitLabel(metricPref ? 'ml' : 'oz');

        let currentTarget = 2000;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.user_metadata) {
          const meta = user.user_metadata;
          setUserName(meta.userName || user.email?.split('@')[0] || 'User');
          
          if (metricPref) setCustomBottleSize(meta.bottle_ml ? parseInt(meta.bottle_ml) : 500);
          else setCustomBottleSize(meta.bottle_oz ? parseInt(meta.bottle_oz) : 16);
          
          let targetOz = calculateWaterIntakeOz(meta);
          currentTarget = metricPref ? Math.round(targetOz * 29.5735) : Math.round(targetOz);
          setDailyTarget(currentTarget);

          const todayStr = getTodayString();
          const cloudIntake = meta.daily_intake; 
          
          if (cloudIntake) {
            if (cloudIntake.date === todayStr) {
              let loadedAmount = cloudIntake.amount;
              if (cloudIntake.isMetric === true && metricPref === false) loadedAmount = Math.round(loadedAmount / 29.5735);
              else if (cloudIntake.isMetric === false && metricPref === true) loadedAmount = Math.round(loadedAmount * 29.5735);
              setCurrentIntake(loadedAmount);
            } else {
              let historyArray = meta.weekly_history || [];
              const oldDateObj = new Date(cloudIntake.date);
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const dayString = dayNames[oldDateObj.getUTCDay()];

              historyArray.push({ day: dayString, amount: cloudIntake.amount, target: cloudIntake.target || 2000, isMetric: cloudIntake.isMetric });
              if (historyArray.length > 7) historyArray.shift();

              const resetIntake = { date: todayStr, amount: 0, isMetric: metricPref, target: currentTarget };
              await supabase.auth.updateUser({ data: { weekly_history: historyArray, daily_intake: resetIntake } });
              setCurrentIntake(0);
            }
          } else {
            const initialIntake = { date: todayStr, amount: 0, isMetric: metricPref, target: currentTarget };
            await supabase.auth.updateUser({ data: { daily_intake: initialIntake, weekly_history: [] } });
          }
        }
      }
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    let percentage = 0;
    if (dailyTarget > 0) percentage = Math.min((currentIntake / dailyTarget) * 100, 100);
    Animated.spring(waterHeight, { toValue: percentage, bounciness: 10, useNativeDriver: false }).start();
  }, [currentIntake, dailyTarget]);

  function calculateWaterIntakeOz(meta: any) {
    let age = 25; 
    if (meta.dob) {
      const dobDate = new Date(meta.dob);
      if (!isNaN(dobDate.getTime())) age = Math.abs(new Date(Date.now() - dobDate.getTime()).getUTCFullYear() - 1970);
    }
    let resultOz = 0;
    if (age < 14) {
      if (age < 1) resultOz = 6; else if (age < 4) resultOz = 32; else if (age < 9) resultOz = 40; else resultOz = 60;              
    } else {
      const weightLbs = parseFloat(meta.weight || '70') * 2.20462; 
      resultOz = (meta.gender === 'M') ? weightLbs * 0.67 : weightLbs * 0.50;
      const activity = meta.exercise || '';
      if (activity.includes("Light")) resultOz += 6; else if (activity.includes("Moderate")) resultOz += 12; else if (activity.includes("High")) resultOz += 24; else if (activity.includes("Extreme")) resultOz += 32;
    }
    if (TROPICAL_COUNTRIES.includes(meta.country || '')) resultOz += 12;
    return resultOz;
  }

  const glassSize = isMetric ? 250 : 8;

  async function addWater(amount: number) {
    const newIntake = currentIntake + amount;
    setCurrentIntake(newIntake); 
    const todayStr = getTodayString();
    const cloudIntake = { date: todayStr, amount: newIntake, isMetric: isMetric, target: dailyTarget };
    await supabase.auth.updateUser({ data: { daily_intake: cloudIntake } });
  }

  async function undoWater() {
    setCurrentIntake(0); 
    const todayStr = getTodayString();
    const resetIntake = { date: todayStr, amount: 0, isMetric: isMetric, target: dailyTarget };
    await supabase.auth.updateUser({ data: { daily_intake: resetIntake } });
  }

  async function saveBottleSize() {
    const size = parseInt(bottleInput);
    if (isNaN(size) || size <= 0) return Alert.alert("Invalid Amount", "Please enter a valid number.");
    setCustomBottleSize(size);
    setShowBottleModal(false);
    setBottleInput('');
    const { error } = await supabase.auth.updateUser({ data: isMetric ? { bottle_ml: size } : { bottle_oz: size } });
    if (error) Alert.alert("Sync Error", "Could not save your bottle to the cloud.");
  }

  const animatedWaterStyle = { height: waterHeight.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) };
  const progressPercentage = dailyTarget > 0 ? Math.round((currentIntake / dailyTarget) * 100) : 0;

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
            <Text style={[styles.greeting, { color: theme.subtext }]}>Good Morning</Text>
            <Text style={[styles.name, { color: theme.text }]}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.iconBtn }]} onPress={undoWater}>
          <Ionicons name="refresh-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* TARGET CARD (Stays Purple for brand consistency) */}
      <View style={styles.targetCard}>
        <View style={styles.targetTextContainer}>
          <Text style={styles.targetTitle}>Daily Drink Target</Text>
          <Text style={styles.targetSubtitle}>Based on your body & climate</Text>
        </View>
        <View style={styles.targetAmountContainer}>
          <Text style={styles.targetAmount}>{dailyTarget}</Text>
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
              {currentIntake} / {dailyTarget} {unitLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => addWater(glassSize)}>
          <Ionicons name="water" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>+ {glassSize} {unitLabel}</Text>
        </TouchableOpacity>

        <View style={styles.bottleButtonWrapper}>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: '#4D8AF0', width: '100%' }]} onPress={() => addWater(customBottleSize)}>
            <Ionicons name="pint" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>+ {customBottleSize} {unitLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.editBottleIcon, { backgroundColor: theme.iconBtn }]} onPress={() => setShowBottleModal(true)}>
            <Ionicons name="settings-sharp" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTLE MODAL */}
      <Modal visible={showBottleModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Set Bottle Size</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>Enter the exact size of your favorite water bottle.</Text>
            
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
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => setShowBottleModal(false)}>
                <Text style={[styles.modalBtnText, { color: '#FF4B4B' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7B61FF' }]} onPress={saveBottleSize}>
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
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});