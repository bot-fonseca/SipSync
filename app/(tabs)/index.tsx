import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TROPICAL_COUNTRIES = ["Brazil", "Colombia", "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "Fiji", "Ghana", "Haiti", "Honduras", "Indonesia", "Ivory Coast", "Jamaica", "Kenya", "Malaysia", "Maldives", "Nicaragua", "Panama", "Papua New Guinea", "Peru", "Philippines", "Puerto Rico", "Senegal", "Singapore", "Sri Lanka", "Thailand", "Venezuela", "Vietnam"];

export default function HomeScreen() {
  const router = useRouter();
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
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) metricPref = JSON.parse(savedUnit);
        } catch (e) {
          console.log("Failed to load unit settings");
        }
        setIsMetric(metricPref);
        setUnitLabel(metricPref ? 'ml' : 'oz');

        // --- THE FIX: SMART UNIT CONVERSION FOR STORED WATER ---
        try {
          const todayStr = getTodayString();
          const savedIntake = await AsyncStorage.getItem('@daily_intake');
          
          if (savedIntake !== null) {
            const parsedIntake = JSON.parse(savedIntake);
            if (parsedIntake.date === todayStr) {
              let loadedAmount = parsedIntake.amount;
              
              // Did they switch units since they last drank water?
              if (parsedIntake.isMetric === true && metricPref === false) {
                loadedAmount = Math.round(loadedAmount / 29.5735); // Convert ml to oz
              } else if (parsedIntake.isMetric === false && metricPref === true) {
                loadedAmount = Math.round(loadedAmount * 29.5735); // Convert oz to ml
              }

              setCurrentIntake(loadedAmount);
              
              // Resave with the new unit so it doesn't double-convert later
              await AsyncStorage.setItem('@daily_intake', JSON.stringify({ 
                date: todayStr, 
                amount: loadedAmount, 
                isMetric: metricPref 
              }));

            } else {
              setCurrentIntake(0);
              await AsyncStorage.setItem('@daily_intake', JSON.stringify({ date: todayStr, amount: 0, isMetric: metricPref }));
            }
          }
        } catch (error) {
          console.log("Failed to load daily intake");
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          const meta = user.user_metadata;
          setUserName(meta.userName || user.email?.split('@')[0] || 'User');
          
          if (metricPref) {
            setCustomBottleSize(meta.bottle_ml ? parseInt(meta.bottle_ml) : 500);
          } else {
            setCustomBottleSize(meta.bottle_oz ? parseInt(meta.bottle_oz) : 16);
          }
          
          let targetOz = calculateWaterIntakeOz(meta);
          if (metricPref) {
            setDailyTarget(Math.round(targetOz * 29.5735));
          } else {
            setDailyTarget(Math.round(targetOz));
          }
        }
      }
      loadDashboardData();
    }, [])
  );

  useEffect(() => {
    let percentage = 0;
    if (dailyTarget > 0) percentage = Math.min((currentIntake / dailyTarget) * 100, 100);

    Animated.spring(waterHeight, {
      toValue: percentage,
      bounciness: 10, 
      useNativeDriver: false, 
    }).start();
  }, [currentIntake, dailyTarget]);

  function calculateWaterIntakeOz(meta: any) {
    let age = 25; 
    if (meta.dob) {
      const dobDate = new Date(meta.dob);
      if (!isNaN(dobDate.getTime())) {
        const ageDifMs = Date.now() - dobDate.getTime();
        age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
      }
    }
    let resultOz = 0;
    if (age < 14) {
      if (age < 1) resultOz = 6;       
      else if (age < 4) resultOz = 32; 
      else if (age < 9) resultOz = 40; 
      else resultOz = 60;              
    } else {
      const weightKg = parseFloat(meta.weight || '70'); 
      const weightLbs = weightKg * 2.20462; 
      if (meta.gender === 'M') resultOz = weightLbs * 0.67;
      else resultOz = weightLbs * 0.50;

      const activity = meta.exercise || '';
      if (activity.includes("Light")) resultOz += 6;
      else if (activity.includes("Moderate")) resultOz += 12;
      else if (activity.includes("High")) resultOz += 24;
      else if (activity.includes("Extreme")) resultOz += 32;
    }
    const country = meta.country || '';
    if (TROPICAL_COUNTRIES.includes(country)) resultOz += 12;
    return resultOz;
  }

  const glassSize = isMetric ? 250 : 8;

  async function addWater(amount: number) {
    const newIntake = currentIntake + amount;
    setCurrentIntake(newIntake); 
    const todayStr = getTodayString();
    // THE FIX: We now save `isMetric` so the app knows what unit this number is!
    await AsyncStorage.setItem('@daily_intake', JSON.stringify({ date: todayStr, amount: newIntake, isMetric: isMetric }));
  }

  async function undoWater() {
    setCurrentIntake(0); 
    const todayStr = getTodayString();
    await AsyncStorage.setItem('@daily_intake', JSON.stringify({ date: todayStr, amount: 0, isMetric: isMetric }));
  }

  async function saveBottleSize() {
    const size = parseInt(bottleInput);
    if (isNaN(size) || size <= 0) return Alert.alert("Invalid Amount", "Please enter a valid number.");
    
    setCustomBottleSize(size);
    setShowBottleModal(false);
    setBottleInput('');

    const dataPayload = isMetric ? { bottle_ml: size } : { bottle_oz: size };
    const { error } = await supabase.auth.updateUser({ data: dataPayload });
    if (error) Alert.alert("Sync Error", "Could not save your bottle to the cloud.");
  }

  const animatedWaterStyle = {
    height: waterHeight.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
  };

  const progressPercentage = dailyTarget > 0 ? Math.round((currentIntake / dailyTarget) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.greetingBox}>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={undoWater}>
          <Ionicons name="refresh-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

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

      <View style={styles.tankContainer}>
        <View style={styles.circleMask}>
          <Animated.View style={[styles.waterFill, animatedWaterStyle]} />
          <View style={styles.tankTextOverlay}>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            <Text style={styles.progressAmount}>{currentIntake} / {dailyTarget} {unitLabel}</Text>
          </View>
        </View>
      </View>

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
          <TouchableOpacity style={styles.editBottleIcon} onPress={() => setShowBottleModal(true)}>
            <Ionicons name="settings-sharp" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showBottleModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Bottle Size</Text>
            <Text style={styles.modalSubtitle}>Enter the exact size of your favorite water bottle.</Text>
            
            <View style={styles.modalInputWrapper}>
              <TextInput style={styles.modalInput} placeholder={`e.g. ${isMetric ? '750' : '32'}`} value={bottleInput} onChangeText={setBottleInput} keyboardType="numeric" autoFocus />
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
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 25, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7B61FF' },
  greetingBox: { justifyContent: 'center' },
  greeting: { fontSize: 14, color: '#888', marginBottom: 2 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

  targetCard: { backgroundColor: '#7B61FF', borderRadius: 20, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowColor: '#7B61FF', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, marginBottom: 40 },
  targetTextContainer: { flex: 1, paddingRight: 10 },
  targetTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  targetSubtitle: { color: '#E0E7FF', fontSize: 13 },
  targetAmountContainer: { alignItems: 'flex-end' },
  targetAmount: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  targetUnit: { color: '#E0E7FF', fontSize: 16, fontWeight: '600', marginTop: -5 },

  tankContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  circleMask: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFF', borderWidth: 8, borderColor: '#E0E7FF', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#43C6FF' },
  tankTextOverlay: { alignItems: 'center', zIndex: 10 },
  progressPercentage: { fontSize: 42, fontWeight: 'bold', color: '#333', textShadowColor: 'rgba(255,255,255,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  progressAmount: { fontSize: 16, color: '#555', fontWeight: '600', marginTop: 5, backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: { flex: 1, backgroundColor: '#7B61FF', paddingVertical: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, elevation: 3, shadowColor: '#7B61FF', shadowOpacity: 0.3, shadowRadius: 5 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  
  bottleButtonWrapper: { flex: 1, position: 'relative', marginHorizontal: 5 },
  editBottleIcon: { position: 'absolute', top: -5, right: -5, backgroundColor: '#333', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 12, paddingHorizontal: 15, marginBottom: 25, width: '100%' },
  modalInput: { flex: 1, paddingVertical: 15, fontSize: 18, fontWeight: 'bold', color: '#7B61FF', textAlign: 'center' },
  modalInputUnit: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginLeft: 10 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});