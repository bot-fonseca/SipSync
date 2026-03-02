import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, DeviceEventEmitter, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const systemTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark');
  const [useKg, setUseKg] = useState(true); // true = Kg, false = Lbs

  // --- DYNAMIC THEME COLORS ---
  const theme = {
    background: isDarkMode ? '#121212' : '#F9F9FB',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#F0F0F0',
  };

  // 1. When the screen loads, check if they saved preferences before
  useEffect(() => {
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
    loadSettings();
  }, []);

  // 2. When they flip the Theme switch, update the screen AND save it
  async function toggleDarkMode(value: boolean) {
    setIsDarkMode(value);
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(value));
    
    // --- THE WALKIE-TALKIE SIGNAL ---
    // This tells _layout.tsx (the bottom bar) to instantly change colors!
    DeviceEventEmitter.emit('themeChanged', value); 
  }

  // 3. When they flip the Unit switch, update the screen AND save it
  async function toggleUnit(value: boolean) {
    setUseKg(value);
    await AsyncStorage.setItem('@use_kg', JSON.stringify(value));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>App Settings</Text>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        
        {/* Theme Toggle */}
        <View style={[styles.item, { borderBottomColor: theme.border }]}>
          <View style={styles.itemLeft}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color="#7B61FF" />
            <Text style={[styles.itemText, { color: theme.text }]}>
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleDarkMode} 
            thumbColor={isDarkMode ? "#7B61FF" : "#FFF"} 
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} 
          />
        </View>

        {/* Unit Toggle (Removed bottom border since it's the last item) */}
        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <View style={styles.itemLeft}>
            <Ionicons name="barbell-outline" size={22} color="#7B61FF" />
            <Text style={[styles.itemText, { color: theme.text }]}>
              Unit ({useKg ? "Kg/cm" : "Lbs/in"})
            </Text>
          </View>
          <Switch 
            value={useKg} 
            onValueChange={toggleUnit} 
            thumbColor={useKg ? "#7B61FF" : "#FFF"} 
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} 
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { borderRadius: 20, padding: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemText: { marginLeft: 15, fontSize: 16, fontWeight: '600' }
});