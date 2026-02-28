import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function StatisticsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Statistics</Text>
      
      {/* This is where you will later add the Victory Native charts */}
      <View style={styles.chartPlaceholder}>
        <Text>Weekly Completion Chart goes here</Text>
      </View>

      <View style={styles.statsCard}>
        <Text>Hydration Stats: 386ml Average</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  chartPlaceholder: { height: 200, backgroundColor: '#EEE', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statsCard: { marginTop: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 15 }
});