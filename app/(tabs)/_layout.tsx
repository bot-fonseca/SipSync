import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

function TabLayoutInner() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#7B61FF',
          tabBarInactiveTintColor: isDark ? '#888888' : '#A0A0A0',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
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
          name="badges"
          options={{
            title: 'Badges',
            tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
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

export default function TabLayout() {
  return <TabLayoutInner />;
}