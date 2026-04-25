import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, useColorScheme, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getSettings, upsertSettings } from '../../lib/waterService';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const { isDark, useSystemTheme, toggleSystemTheme, toggleDarkMode } = useTheme();
  const [useKg, setUseKg] = useState(true);

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const settings = await getSettings();
        if (settings !== null) setUseKg(settings.use_metric);
      }
      loadSettings();
    }, [])
  );

  async function toggleUnit(value: boolean) {
    setUseKg(value);
    await upsertSettings({ use_metric: value });
  }

  async function handleToggleDarkMode(value: boolean) {
    await toggleDarkMode(value);
    await AsyncStorage.setItem('@system_theme', JSON.stringify(false));
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(value));
    DeviceEventEmitter.emit('themeChanged', value);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>App Settings</Text>

      <View style={[styles.section, { backgroundColor: theme.card }]}>

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

        <View style={[styles.item, { borderBottomColor: theme.border }]}>
          <View style={styles.itemLeft}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={22} color="#7B61FF" />
            <Text style={[styles.itemText, { color: theme.text }]}>
              {isDark ? "Dark Mode" : "Light Mode"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleToggleDarkMode}
            thumbColor={isDark ? "#7B61FF" : "#FFF"}
            trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }}
            disabled={useSystemTheme}
          />
        </View>

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
  itemText: { marginLeft: 15, fontSize: 16, fontWeight: '600' },
});