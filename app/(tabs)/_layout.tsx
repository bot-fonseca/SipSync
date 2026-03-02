import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  useEffect(() => {
    // 1. Load the saved theme when the app starts
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem('@dark_mode');
        if (savedTheme !== null) {
          setIsDark(JSON.parse(savedTheme));
        }
      } catch (e) {
        console.log("Failed to load theme settings");
      }
    }
    loadTheme();

    // 2. Listen for the switch being toggled in the Settings screen
    const subscription = DeviceEventEmitter.addListener('themeChanged', (newTheme) => {
      setIsDark(newTheme);
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      {/* Changes the top WiFi/Battery icons to white when Dark Mode is on */}
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Tabs 
        screenOptions={{ 
          tabBarActiveTintColor: '#7B61FF',
          tabBarInactiveTintColor: isDark ? '#888888' : '#A0A0A0', // Dims inactive icons
          headerShown: false, 
          tabBarStyle: {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', // The dynamic background!
            borderTopWidth: 0,
            elevation: 0, 
            shadowOpacity: 0,
            height: 60,
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alarm"
          options={{
            title: 'Alarm',
            tabBarIcon: ({ color }) => <Ionicons name="alarm" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Statistics',
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}