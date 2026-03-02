import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type DayData = {
  day: string;
  amount: number;
  target: number;
};

export default function StatisticsScreen() {
  const [isMetric, setIsMetric] = useState(true);
  const [unitLabel, setUnitLabel] = useState('ml');
  const [history, setHistory] = useState<DayData[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  
  // --- NEW: STREAK STATE ---
  const [streak, setStreak] = useState(0);

  const animationValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        let metricPref = true;
        try {
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) metricPref = JSON.parse(savedUnit);
        } catch (e) { console.log("Failed to load settings"); }
        setIsMetric(metricPref);
        setUnitLabel(metricPref ? 'ml' : 'oz');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.user_metadata) return;
        const meta = user.user_metadata;

        // 1. CLOUD LIVE DATA (Today)
        let liveAmount = 0;
        let liveTarget = metricPref ? 2000 : 68;
        const todayStr = new Date().toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayDayName = dayNames[new Date().getDay()];

        const cloudIntake = meta.daily_intake;
        if (cloudIntake && cloudIntake.date === todayStr) {
          liveAmount = cloudIntake.amount;
          liveTarget = cloudIntake.target || liveTarget;
          
          if (cloudIntake.isMetric && !metricPref) {
            liveAmount = Math.round(liveAmount / 29.5735);
            liveTarget = Math.round(liveTarget / 29.5735);
          } else if (!cloudIntake.isMetric && metricPref) {
            liveAmount = Math.round(liveAmount * 29.5735);
            liveTarget = Math.round(liveTarget * 29.5735);
          }
        }

        // 2. CLOUD PAST HISTORY
        let adjustedHistory: DayData[] = [];
        const cloudHistory = meta.weekly_history || [];
        
        adjustedHistory = cloudHistory.map((item: any) => {
          let adjAmount = item.amount;
          let adjTarget = item.target;
          
          if (item.isMetric && !metricPref) {
            adjAmount = Math.round(adjAmount / 29.5735);
            adjTarget = Math.round(adjTarget / 29.5735);
          } else if (!item.isMetric && metricPref) {
            adjAmount = Math.round(adjAmount * 29.5735);
            adjTarget = Math.round(adjTarget * 29.5735);
          }
          return { day: item.day, amount: adjAmount, target: adjTarget };
        });

        // 3. STITCH TOGETHER
        const pastDaysOnly = adjustedHistory.filter(d => d.day !== todayDayName);
        const finalChartData = [...pastDaysOnly, { day: todayDayName, amount: liveAmount, target: liveTarget }];
        
        if (finalChartData.length > 7) finalChartData.splice(0, finalChartData.length - 7);

        setHistory(finalChartData);

        // 4. CALCULATE WEEKLY AVERAGE
        const total = finalChartData.reduce((sum: number, day: DayData) => sum + day.amount, 0);
        setWeeklyAverage(Math.round(total / finalChartData.length));

        // --- 5. THE NEW STREAK CALCULATOR ---
        let currentStreak = 0;
        // Loop backwards from today to the oldest day
        for (let i = finalChartData.length - 1; i >= 0; i--) {
          const dayData = finalChartData[i];
          const isToday = i === finalChartData.length - 1;

          if (dayData.amount >= dayData.target) {
            currentStreak++; // Target met! Add to streak.
          } else {
            // Target NOT met.
            if (isToday) {
              // If today isn't met YET, we don't break the streak. We just keep looking at yesterday.
              continue; 
            } else {
              // If a PAST day wasn't met, the streak is officially broken. Stop counting.
              break; 
            }
          }
        }
        setStreak(currentStreak);

        // Trigger animation
        animationValue.setValue(0);
        Animated.timing(animationValue, { toValue: 1, duration: 800, useNativeDriver: false }).start();
      }
      
      loadStats();
    }, [])
  );

  async function generateTestData() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();
    
    let fakeData = [];
    for (let i = 6; i >= 1; i--) {
      let dayIdx = todayIndex - i;
      if (dayIdx < 0) dayIdx += 7; 
      fakeData.push({ 
        day: dayNames[dayIdx], 
        // Generates data that is very likely to hit the target so you can see a cool streak!
        amount: isMetric ? Math.floor(Math.random() * 500) + 1900 : Math.floor(Math.random() * 20) + 60, 
        target: isMetric ? 2000 : 68, 
        isMetric: isMetric 
      });
    }

    await supabase.auth.updateUser({ data: { weekly_history: fakeData } });
    Alert.alert("Success", "Cloud test data generated! Switch to the Home tab and back to refresh the chart.");
  }

  const maxChartValue = history.length > 0 ? Math.max(...history.map(d => Math.max(d.amount, d.target))) : isMetric ? 3000 : 100;

  return (
    <ScrollView style={styles.container}>
      
      {/* --- NEW HEADER WITH STREAK BADGE --- */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSubtitle}>Weekly Overview</Text>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{streak} {streak === 1 ? 'Day' : 'Days'}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Ionicons name="stats-chart" size={24} color="#7B61FF" />
        </View>
        <View style={styles.summaryTextBox}>
          <Text style={styles.summaryTitle}>Weekly Average</Text>
          <Text style={styles.summaryValue}>{weeklyAverage} <Text style={styles.summaryUnit}>{unitLabel} / day</Text></Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Past 7 Days</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyChart}>
            <Ionicons name="water-outline" size={40} color="#E0E7FF" />
            <Text style={styles.emptyChartText}>No data yet.</Text>
            <Text style={styles.emptyChartSub}>Drink some water to start tracking!</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {history.map((data, index) => {
              const fillPercentage = Math.min((data.amount / maxChartValue) * 100, 100);
              const isGoalMet = data.amount >= data.target;

              const animatedHeight = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${fillPercentage}%`]
              });

              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barBackground}>
                    <Animated.View style={[
                      styles.barFill, 
                      { height: animatedHeight },
                      isGoalMet ? { backgroundColor: '#43C6FF' } : { backgroundColor: '#7B61FF' }
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{data.day}</Text>
                </View>
              );
            })}
          </View>
        )}
        
        {history.length > 0 && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#43C6FF' }]} />
              <Text style={styles.legendText}>Goal Met</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7B61FF' }]} />
              <Text style={styles.legendText}>Under Goal</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.testButton} onPress={generateTestData}>
        <Ionicons name="flask-outline" size={20} color="#888" />
        <Text style={styles.testButtonText}>Generate Past 6 Days (Test Data)</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 25, paddingTop: 60 },
  
  // --- UPDATED HEADER STYLES ---
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 16, color: '#888', marginTop: 5 },
  
  streakBadge: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#FF9800', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  streakIcon: { fontSize: 18, marginRight: 6 },
  streakText: { fontSize: 16, fontWeight: 'bold', color: '#FF9800' },

  summaryCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  summaryIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  summaryTextBox: { flex: 1 },
  summaryTitle: { fontSize: 14, color: '#888', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  summaryUnit: { fontSize: 16, color: '#888', fontWeight: 'normal' },
  chartCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  barColumn: { alignItems: 'center', width: 35 },
  barBackground: { width: 14, height: 160, backgroundColor: '#F0F4FF', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 10 },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#888', fontWeight: '600' },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 10 },
  emptyChartSub: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },
  testButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, padding: 15, borderRadius: 15, backgroundColor: '#E0E7FF' },
  testButtonText: { color: '#888', fontWeight: 'bold', marginLeft: 10 }
});