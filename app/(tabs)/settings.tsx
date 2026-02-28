import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <SettingItem icon="person-outline" title="Account Profile" />
        <SettingItem icon="notifications-outline" title="Push Notifications" isSwitch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        <SettingItem icon="color-palette-outline" title="Appearance" />
        <SettingItem icon="shield-checkmark-outline" title="Privacy & Security" />
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// Helper component for clean list items
function SettingItem({ icon, title, isSwitch = false, value = false, onValueChange = () => {} }: { icon: string; title: string; isSwitch?: boolean; value?: boolean; onValueChange?: (value: boolean) => void }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon as any} size={22} color="#7B61FF" />
        <Text style={styles.itemText}>{title}</Text>
      </View>
      {isSwitch ? (
        <Switch value={value} onValueChange={onValueChange} thumbColor="#7B61FF" trackColor={{ false: "#D1D1D1", true: "#E0E7FF" }} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 25, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { backgroundColor: '#FFF', borderRadius: 20, padding: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemText: { marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { marginTop: 40, alignItems: 'center' },
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});