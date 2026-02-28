import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlarmScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity><Ionicons name="chevron-back" size={24} color="black" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={24} color="black" /></TouchableOpacity>
      </View>

      {/* The Circular Gauge Placeholder */}
      <View style={styles.gaugeContainer}>
        <View style={styles.outerCircle}>
          <Text style={styles.gaugeText}>800/2210ml</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Today's records</Text>

      {/* Record Item */}
      <View style={styles.recordCard}>
        <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
          <Ionicons name="notifications" size={20} color="#7B61FF" />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTime}>05:00 PM</Text>
          <Text style={styles.recordSub}>Next time</Text>
        </View>
        <Text style={styles.recordAmount}>200 ml</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  gaugeContainer: { alignItems: 'center', marginBottom: 40 },
  outerCircle: { 
    width: 220, height: 220, borderRadius: 110, 
    borderWidth: 15, borderColor: '#E0E7FF', 
    justifyContent: 'center', alignItems: 'center' 
  },
  gaugeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  recordCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
    padding: 15, borderRadius: 20, marginBottom: 10,
    // Add a slight shadow for that "Clean" look
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, marginLeft: 15 },
  recordTime: { fontWeight: 'bold', fontSize: 16 },
  recordSub: { color: '#888', fontSize: 12 },
  recordAmount: { fontWeight: 'bold', color: '#333' }
});