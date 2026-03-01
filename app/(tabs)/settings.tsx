import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useKg, setUseKg] = useState(true); // true = Kg, false = Lbs

  // 1. When the screen loads, check if they saved preferences before
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const savedTheme = await AsyncStorage.getItem('@dark_mode');
      const savedUnit = await AsyncStorage.getItem('@use_kg');
      
      if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
      if (savedUnit !== null) setUseKg(JSON.parse(savedUnit));
    } catch (e) {
      console.log('Failed to load settings', e);
    }
  }

  // 2. When they flip the Theme switch, update the screen AND save it
  async function toggleDarkMode(value: boolean) {
    setIsDarkMode(value);
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(value));
  }

  // 3. When they flip the Unit switch, update the screen AND save it
  async function toggleUnit(value: boolean) {
    setUseKg(value);
    await AsyncStorage.setItem('@use_kg', JSON.stringify(value));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>App Settings</Text>

      <View style={styles.section}>
        {/* Theme Toggle */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color="#7B61FF" />
            <Text style={styles.itemText}>{isDarkMode ? "Dark Mode" : "Light Mode"}</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleDarkMode} // <-- Using the new save function
            thumbColor="#7B61FF" 
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} 
          />
        </View>

        {/* Unit Toggle */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="barbell-outline" size={22} color="#7B61FF" />
            <Text style={styles.itemText}>Unit ({useKg ? "Kg/cm" : "Lbs/in"})</Text>
          </View>
          <Switch 
            value={useKg} 
            onValueChange={toggleUnit} // <-- Using the new save function
            thumbColor="#7B61FF" 
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 25, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { backgroundColor: '#FFF', borderRadius: 20, padding: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemText: { marginLeft: 15, fontSize: 16, color: '#333' }
});