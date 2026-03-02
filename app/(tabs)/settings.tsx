import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, DeviceEventEmitter, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const systemTheme = useColorScheme(); // Reads the phone's global setting (light or dark)
  
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark');
  const [useSystemTheme, setUseSystemTheme] = useState(true); // NEW: Auto Theme Toggle
  const [useKg, setUseKg] = useState(true); 

  const theme = {
    background: isDarkMode ? '#121212' : '#F9F9FB',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#F0F0F0',
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedSystem = await AsyncStorage.getItem('@system_theme');
        const savedTheme = await AsyncStorage.getItem('@dark_mode');
        const savedUnit = await AsyncStorage.getItem('@use_kg');
        
        if (savedSystem !== null) {
          const isSystem = JSON.parse(savedSystem);
          setUseSystemTheme(isSystem);
          // If Auto is on, force it to match the phone
          if (isSystem) setIsDarkMode(systemTheme === 'dark');
          else if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
        } else if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }

        if (savedUnit !== null) setUseKg(JSON.parse(savedUnit));
      } catch (e) {
        console.log('Failed to load settings', e);
      }
    }
    loadSettings();
  }, [systemTheme]); // Re-runs if the user changes their phone's global settings!

  // --- NEW: AUTO THEME TOGGLE ---
  async function toggleSystemTheme(value: boolean) {
    setUseSystemTheme(value);
    await AsyncStorage.setItem('@system_theme', JSON.stringify(value));
    
    if (value) {
      // If turned ON, instantly match the phone's system theme
      const currentSystemDark = systemTheme === 'dark';
      setIsDarkMode(currentSystemDark);
      await AsyncStorage.setItem('@dark_mode', JSON.stringify(currentSystemDark));
      DeviceEventEmitter.emit('themeChanged', currentSystemDark); 
    }
  }

  // MANUAL THEME TOGGLE
  async function toggleDarkMode(value: boolean) {
    setIsDarkMode(value);
    setUseSystemTheme(false); // Instantly turn off "Auto" if they manually override it
    
    await AsyncStorage.setItem('@system_theme', JSON.stringify(false));
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(value));
    DeviceEventEmitter.emit('themeChanged', value); 
  }

  async function toggleUnit(value: boolean) {
    setUseKg(value);
    await AsyncStorage.setItem('@use_kg', JSON.stringify(value));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>App Settings</Text>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        
        {/* NEW: Auto System Theme Toggle */}
        <View style={[styles.item, { borderBottomColor: theme.border }]}>
          <View style={styles.itemLeft}>
            <Ionicons name="phone-portrait-outline" size={22} color="#7B61FF" />
            <Text style={[styles.itemText, { color: theme.text }]}>Use Device Settings</Text>
          </View>
          <Switch 
            value={useSystemTheme} 
            onValueChange={toggleSystemTheme} 
            thumbColor={useSystemTheme ? "#7B61FF" : "#FFF"} 
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} 
          />
        </View>

        {/* Manual Theme Toggle */}
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
            disabled={useSystemTheme} // Gray it out slightly if Auto is taking control
          />
        </View>

        {/* Unit Toggle */}
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