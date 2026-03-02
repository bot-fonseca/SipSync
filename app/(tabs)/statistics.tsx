import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, useColorScheme } from 'react-native';
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
  // --- DARK MODE SETUP ---
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
    iconBg: isDark ? '#2C2C2E' : '#F0F4FF',
    barBg: isDark ? '#2C2C2E' : '#F0F4FF',
  };

  const [isMetric, setIsMetric] = useState(true);
  const [unitLabel, setUnitLabel] = useState('ml');
  const [history, setHistory] = useState<DayData[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [streak, setStreak] = useState(0);

  const animationValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        // Load Dark Mode Preference
        const savedTheme = await AsyncStorage.getItem('@dark_mode');
        if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));

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

        // 5. CALCULATE STREAK
        let currentStreak = 0;
        for (let i = finalChartData.length - 1; i >= 0; i--) {
          const dayData = finalChartData[i];
          const isToday = i === finalChartData.length - 1;

          if (dayData.amount >= dayData.target) {
            currentStreak++; 
          } else {
            if (isToday) continue; 
            else break; 
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Progress</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Weekly Overview</Text>
        </View>

        <View style={[styles.streakBadge, { backgroundColor: theme.card }]}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{streak} {streak === 1 ? 'Day' : 'Days'}</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <View style={[styles.summaryIconBox, { backgroundColor: theme.iconBg }]}>
          <Ionicons name="stats-chart" size={24} color="#7B61FF" />
        </View>
        <View style={styles.summaryTextBox}>
          <Text style={[styles.summaryTitle, { color: theme.subtext }]}>Weekly Average</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{weeklyAverage} <Text style={[styles.summaryUnit, { color: theme.subtext }]}>{unitLabel} / day</Text></Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Past 7 Days</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyChart}>
            <Ionicons name="water-outline" size={40} color={theme.iconBg} />
            <Text style={[styles.emptyChartText, { color: theme.text }]}>No data yet.</Text>
            <Text style={[styles.emptyChartSub, { color: theme.subtext }]}>Drink some water to start tracking!</Text>
          </View>
        ) : (
          <View style={[styles.chartContainer, { borderBottomColor: theme.border }]}>
            {history.map((data, index) => {
              const fillPercentage = Math.min((data.amount / maxChartValue) * 100, 100);
              const isGoalMet = data.amount >= data.target;

              const animatedHeight = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${fillPercentage}%`]
              });

              return (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.barBackground, { backgroundColor: theme.barBg }]}>
                    <Animated.View style={[
                      styles.barFill, 
                      { height: animatedHeight },
                      isGoalMet ? { backgroundColor: '#43C6FF' } : { backgroundColor: '#7B61FF' }
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.subtext }]}>{data.day}</Text>
                </View>
              );
            })}
          </View>
        )}
        
        {history.length > 0 && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#43C6FF' }]} />
              <Text style={[styles.legendText, { color: theme.subtext }]}>Goal Met</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7B61FF' }]} />
              <Text style={[styles.legendText, { color: theme.subtext }]}>Under Goal</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.testButton, { backgroundColor: theme.iconBg }]} onPress={generateTestData}>
        <Ionicons name="flask-outline" size={20} color={theme.subtext} />
        <Text style={[styles.testButtonText, { color: theme.subtext }]}>Generate Past 6 Days</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, marginTop: 5 },
  
  streakBadge: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#FF9800', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  streakIcon: { fontSize: 18, marginRight: 6 },
  streakText: { fontSize: 16, fontWeight: 'bold', color: '#FF9800' },

  summaryCard: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  summaryIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  summaryTextBox: { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold' },
  summaryUnit: { fontSize: 16, fontWeight: 'normal' },
  
  chartCard: { borderRadius: 20, padding: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200, paddingBottom: 10, borderBottomWidth: 1 },
  barColumn: { alignItems: 'center', width: 35 },
  barBackground: { width: 14, height: 160, borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 10 },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 12, fontWeight: '600' },
  
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, fontWeight: '600' },
  
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptyChartSub: { fontSize: 14, marginTop: 5, textAlign: 'center' },
  
  testButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, padding: 15, borderRadius: 15 },
  testButtonText: { fontWeight: 'bold', marginLeft: 10 }
});