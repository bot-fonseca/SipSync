import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, useColorScheme } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWeeklyHistory, getSettings, convertAmount } from '../../lib/waterService';
import { useTheme } from '../../contexts/ThemeContext';

export default function StatisticsScreen() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    iconBg: isDark ? '#2C2C2E' : '#F0F4FF',
    barBg: isDark ? '#2C2C2E' : '#F0F4FF',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  const [isMetric, setIsMetric] = useState(true);
  const [unitLabel, setUnitLabel] = useState('ml');
  const [history, setHistory] = useState<{ day: string; amount: number; target: number }[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [streak, setStreak] = useState(0);

  const animationValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        // 2. Settings (unidade + target)
        const settings = await getSettings();
        const metric = settings?.use_metric ?? true;
        const targetMl = settings?.daily_target_ml ?? 2000;
        setIsMetric(metric);
        setUnitLabel(metric ? 'ml' : 'oz');

        // 3. Histórico da BD (últimos 7 dias)
        const rawHistory = await getWeeklyHistory();

        // Converte para a unidade preferida do utilizador
        const converted = rawHistory.map(d => ({
          day: d.day,
          amount: convertAmount(d.amount_ml, metric),
          target: convertAmount(targetMl, metric),
        }));

        // Ordem: hoje à direita
        setHistory([...converted].reverse());

        // 4. Média semanal
        const total = converted.reduce((sum, d) => sum + d.amount, 0);
        setWeeklyAverage(Math.round(total / converted.length));

        // 5. Streak — dias consecutivos a atingir o objetivo
        // converted[0] = há 6 dias, converted[6] = hoje
        let currentStreak = 0;
        for (let i = converted.length - 1; i >= 0; i--) {
          const d = converted[i];
          const isToday = i === converted.length - 1;

          if (d.amount >= d.target) {
            currentStreak++;
          } else {
            if (isToday && d.amount > 0) {
              // Hoje ainda não atingiu mas já bebeu algo — não quebra o streak
              continue;
            } else if (isToday && d.amount === 0) {
              // Hoje não bebeu nada ainda — não conta mas também não quebra
              continue;
            } else {
              // Dia passado sem atingir o objetivo — quebra o streak
              break;
            }
          }
        }
        setStreak(currentStreak);

        // 6. Animação das barras
        animationValue.setValue(0);
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }

      loadStats();
    }, [])
  );

  const maxChartValue = history.length > 0
    ? Math.max(...history.map(d => Math.max(d.amount, d.target)))
    : isMetric ? 3000 : 100;

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
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {weeklyAverage} <Text style={[styles.summaryUnit, { color: theme.subtext }]}>{unitLabel} / day</Text>
          </Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Past 7 Days</Text>

        {history.length === 0 ? (
          <View style={styles.emptyChart}>
            <Ionicons name="water-outline" size={40} color={theme.iconBg} />
            <Text style={[styles.emptyChartText, { color: theme.text }]}>No data yet.</Text>
            <Text style={[styles.emptyChartSub, { color: theme.subtext }]}>
              Drink some water to start tracking!
            </Text>
          </View>
        ) : (
          <View style={[styles.chartContainer, { borderBottomColor: theme.border }]}>
            {history.map((data, index) => {
              const fillPercentage = Math.min((data.amount / maxChartValue) * 100, 100);
              const isGoalMet = data.amount >= data.target;

              const animatedHeight = animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', `${fillPercentage}%`],
              });

              return (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.barBackground, { backgroundColor: theme.barBg }]}>
                    <Animated.View style={[
                      styles.barFill,
                      { height: animatedHeight },
                      { backgroundColor: isGoalMet ? '#43C6FF' : '#7B61FF' },
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
});