import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { getTotalWater, convertAmount } from '../../lib/waterService';
import { BADGES, getUnlockedBadges, getNextBadge, getProgressToNext } from '../../constants/badges';

export default function BadgesScreen() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    iconBg: isDark ? '#2C2C2E' : '#F0F4FF',
    border: isDark ? '#333333' : '#F0F0F0',
    progressBg: isDark ? '#2C2C2E' : '#F0F0F0',
  };

  const [totalMl, setTotalMl] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const total = await getTotalWater();
        setTotalMl(total);
        setUnlockedIds(getUnlockedBadges(total).map(b => b.id));
      }
      load();
    }, [])
  );

  const nextBadge = getNextBadge(totalMl);
  const progress = getProgressToNext(totalMl);
  const totalLiters = (totalMl / 1000).toFixed(1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <Text style={[styles.headerTitle, { color: theme.text }]}>Achievements</Text>
      <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>
        {unlockedIds.length} of {BADGES.length} unlocked
      </Text>

      {/* TOTAL CARD */}
      <View style={[styles.totalCard, { backgroundColor: '#7B61FF' }]}>
        <Text style={styles.totalEmoji}>💧</Text>
        <View>
          <Text style={styles.totalLabel}>Total water consumed</Text>
          <Text style={styles.totalValue}>{totalLiters}L</Text>
        </View>
      </View>

      {/* NEXT BADGE PROGRESS */}
      {nextBadge && (
        <View style={[styles.nextCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.nextLabel, { color: theme.subtext }]}>Next achievement</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextEmoji}>{nextBadge.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextTitle, { color: theme.text }]}>{nextBadge.title}</Text>
              <Text style={[styles.nextDesc, { color: theme.subtext }]}>{nextBadge.description}</Text>
              <View style={[styles.progressBar, { backgroundColor: theme.progressBg }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: nextBadge.color }]} />
              </View>
              <Text style={[styles.progressText, { color: theme.subtext }]}>{progress}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* BADGES GRID */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>All Badges</Text>
      <View style={styles.grid}>
        {BADGES.map(badge => {
          const unlocked = unlockedIds.includes(badge.id);
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                { backgroundColor: theme.card },
                !unlocked && { opacity: 0.4 }
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={[styles.badgeTitle, { color: theme.text }]}>{badge.title}</Text>
              <Text style={[styles.badgeDesc, { color: theme.subtext }]} numberOfLines={2}>
                {badge.description}
              </Text>
              {unlocked && (
                <View style={[styles.unlockedPill, { backgroundColor: badge.color + '22' }]}>
                  <Text style={[styles.unlockedText, { color: badge.color }]}>Unlocked!</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, marginBottom: 25 },
  totalCard: { flexDirection: 'row', alignItems: 'center', padding: 25, borderRadius: 20, marginBottom: 20, gap: 15 },
  totalEmoji: { fontSize: 40 },
  totalLabel: { color: '#E0E7FF', fontSize: 14, marginBottom: 4 },
  totalValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  nextCard: { padding: 20, borderRadius: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  nextLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 15 },
  nextEmoji: { fontSize: 36 },
  nextTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  nextDesc: { fontSize: 13, marginBottom: 10 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  badgeCard: { width: '47%', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  badgeEmoji: { fontSize: 36, marginBottom: 8 },
  badgeTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  badgeDesc: { fontSize: 11, textAlign: 'center', marginBottom: 8 },
  unlockedPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  unlockedText: { fontSize: 11, fontWeight: 'bold' },
});