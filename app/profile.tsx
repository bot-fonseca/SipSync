import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, FlatList, useColorScheme } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXERCISE_OPTIONS = ["Sedentary (Little to none)", "Light (1-3 times/week)", "Moderate (3-5 times/week)", "High (5-7 times/week)", "Extreme (Heavy exercise/job)"];
const COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Brazil", "Canada", "China", "Colombia", "France", "Germany", "India", "Italy", "Japan", "Mexico", "Portugal", "Puerto Rico", "Spain", "United Kingdom", "United States", "Venezuela"];

export default function ProfileScreen() {
  const router = useRouter();
  
  // --- NEW: DARK MODE SETUP ---
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#E0E7FF',
    inputBg: isDark ? '#2C2C2E' : '#F9F9FB',
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [email, setEmail] = useState('Loading...');
  const [metadata, setMetadata] = useState<any>({});
  const [isMetric, setIsMetric] = useState(true); 

  const [isEditing, setIsEditing] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editExercise, setEditExercise] = useState('');

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchCountry.toLowerCase()));

  useFocusEffect(
    useCallback(() => {
      async function loadUserData() {
        // --- LOAD DARK MODE PREFERENCE ---
        try {
          const savedTheme = await AsyncStorage.getItem('@dark_mode');
          if (savedTheme !== null) setIsDark(JSON.parse(savedTheme));
        } catch (e) { console.log("Failed to load theme settings"); }

        try {
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) setIsMetric(JSON.parse(savedUnit));
        } catch (e) { console.log("Failed to load unit settings"); }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          if (user.user_metadata) {
            setMetadata(user.user_metadata);
            setEditUserName(user.user_metadata.userName || '');
            setEditDob(user.user_metadata.dob || '');
            setEditGender(user.user_metadata.gender || '');
            setEditCountry(user.user_metadata.country || '');     
            setEditExercise(user.user_metadata.exercise || '');   
            
            const rawWeight = parseFloat(user.user_metadata.weight || '0');
            const rawHeight = parseFloat(user.user_metadata.height || '0');
            const metricCheck = await AsyncStorage.getItem('@use_kg');
            const prefersMetric = metricCheck !== null ? JSON.parse(metricCheck) : true;

            if (prefersMetric) {
              setEditWeight(user.user_metadata.weight || '');
              setEditHeight(user.user_metadata.height || '');
            } else {
              setEditWeight(rawWeight ? (rawWeight * 2.20462).toFixed(1).toString() : '');
              setEditHeight(rawHeight ? (rawHeight * 0.393701).toFixed(1).toString() : '');
            }
          }
        }
      }
      loadUserData();
    }, [])
  );

  function calculateAge(dobString: string) {
    if (!dobString) return '--';
    const birthday = new Date(dobString);
    if (isNaN(birthday.getTime())) return '--'; 
    const ageDifMs = Date.now() - birthday.getTime();
    return Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
  }

  function formatExercise(text: string) { return text ? text.split(' ')[0] : '--'; }

  function handleEditDobChange(text: string) {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    if (cleaned.length > 6) formatted = formatted.substring(0, 7) + '-' + cleaned.substring(6, 8);
    setEditDob(formatted);
  }

  async function handleSaveProfile() {
    if (editDob) {
      if (editDob.length !== 10) return Alert.alert("Invalid Date", "Please enter a complete date (YYYY-MM-DD).");
      const dobDate = new Date(editDob);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) return Alert.alert("Invalid Date", "Please enter a valid date in the past.");
    }

    let weightToSave = editWeight;
    let heightToSave = editHeight;
    if (!isMetric) {
      if (editWeight) weightToSave = (parseFloat(editWeight) / 2.20462).toFixed(1).toString();
      if (editHeight) heightToSave = (parseFloat(editHeight) / 0.393701).toFixed(1).toString();
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { userName: editUserName, dob: editDob, gender: editGender, weight: weightToSave, height: heightToSave, country: editCountry, exercise: editExercise }
    });

    if (error) Alert.alert("Error", error.message);
    else { setMetadata(data.user.user_metadata); setIsEditing(false); }
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  async function handlePasswordChange() {
    if (newPassword.length < 6) return Alert.alert("Weak Password", "Must be at least 6 characters.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", "Password updated!");
      setShowPasswordModal(false);
      setNewPassword('');
    }
  }

  const firstLetter = metadata.userName ? metadata.userName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
  const displayWeight = isMetric ? metadata.weight : metadata.weight ? (parseFloat(metadata.weight) * 2.20462).toFixed(1) : '--';
  const displayHeight = isMetric ? metadata.height : metadata.height ? (parseFloat(metadata.height) * 0.393701).toFixed(1) : '--';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* INFO CARD */}
      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{firstLetter}</Text></View>
        {isEditing ? (
          <TextInput style={[styles.editInputLine, { color: theme.text, borderBottomColor: theme.border }]} placeholderTextColor={theme.subtext} value={editUserName} onChangeText={setEditUserName} placeholder="Username" />
        ) : (
          <Text style={[styles.nameText, { color: theme.text }]}>{metadata.userName || 'No Username'}</Text>
        )}
        <Text style={[styles.emailText, { color: theme.subtext }]}>{email}</Text>

        {/* --- THE 2x3 GRID --- */}
        <View style={styles.metricsGrid}>
          
          <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
            {isEditing ? <TextInput style={[styles.editGridInput, { color: theme.text }]} placeholderTextColor={theme.subtext} value={editDob} onChangeText={handleEditDobChange} placeholder="YYYY-MM-DD" keyboardType="numeric" maxLength={10} />
            : <Text style={styles.metricValue}>{calculateAge(metadata.dob)}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>{isEditing ? 'Birth' : 'Age'}</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
            {isEditing ? (
              <View style={styles.genderToggleRow}>
                <TouchableOpacity style={[styles.miniGenderBtn, { borderColor: theme.border }, editGender === 'M' && styles.miniGenderActive]} onPress={() => setEditGender('M')}><Text style={[styles.miniGenderText, { color: theme.subtext }, editGender === 'M' && styles.miniGenderTextActive]}>M</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.miniGenderBtn, { borderColor: theme.border }, editGender === 'F' && styles.miniGenderActive]} onPress={() => setEditGender('F')}><Text style={[styles.miniGenderText, { color: theme.subtext }, editGender === 'F' && styles.miniGenderTextActive]}>F</Text></TouchableOpacity>
              </View>
            ) : <Text style={styles.metricValue}>{metadata.gender || '--'}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Gender</Text>
          </View>
          
          <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
            {isEditing ? <TextInput style={[styles.editGridInput, { color: theme.text }]} placeholderTextColor={theme.subtext} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" placeholder={isMetric ? 'kg' : 'lbs'} />
            : <Text style={styles.metricValue}>{displayWeight !== '--' ? `${displayWeight}` : '--'}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Weight ({isMetric ? 'kg' : 'lb'})</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.inputBg }]}>
            {isEditing ? <TextInput style={[styles.editGridInput, { color: theme.text }]} placeholderTextColor={theme.subtext} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" placeholder={isMetric ? 'cm' : 'in'} />
            : <Text style={styles.metricValue}>{displayHeight !== '--' ? `${displayHeight}` : '--'}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Height ({isMetric ? 'cm' : 'in'})</Text>
          </View>

          <TouchableOpacity style={[styles.metricBox, { backgroundColor: theme.inputBg }]} disabled={!isEditing} onPress={() => setShowCountryModal(true)}>
            {isEditing ? <Text style={[styles.editGridInput, { color: theme.text, fontSize: 14, paddingTop: 5 }]} numberOfLines={1}>{editCountry || 'Select'}</Text>
            : <Text style={[styles.metricValue, { fontSize: 16 }]} numberOfLines={1}>{metadata.country || '--'}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Country</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricBox, { backgroundColor: theme.inputBg }]} disabled={!isEditing} onPress={() => setShowExerciseModal(true)}>
            {isEditing ? <Text style={[styles.editGridInput, { color: theme.text, fontSize: 14, paddingTop: 5 }]}>{formatExercise(editExercise) || 'Select'}</Text>
            : <Text style={[styles.metricValue, { fontSize: 16 }]} numberOfLines={1}>{formatExercise(metadata.exercise)}</Text>}
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Activity</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* BOTTOM CONTROLS */}
      {!isEditing && (
        <View style={styles.bottomControls}>
          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowPasswordModal(true)}>
            <Ionicons name="lock-closed-outline" size={20} color="#7B61FF" style={{ marginRight: 8 }}/>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.card }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4B4B" style={{ marginRight: 8 }}/>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- PASSWORD MODAL --- */}
      <Modal visible={showPasswordModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Security</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>Enter your new password below.</Text>
            
            <TextInput style={[styles.passwordInput, { backgroundColor: theme.inputBg, color: theme.text }]} placeholderTextColor={theme.subtext} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} autoFocus />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => setShowPasswordModal(false)}>
                <Text style={[styles.modalBtnText, { color: '#FF4B4B' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7B61FF' }]} onPress={handlePasswordChange}>
                <Text style={styles.modalBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- COUNTRY & EXERCISE MODALS --- */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Country</Text>
            <TextInput style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text }]} placeholderTextColor={theme.subtext} placeholder="Search..." value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            <FlatList data={filteredCountries} keyExtractor={(item) => item} renderItem={({ item }) => (
                <TouchableOpacity style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => { setEditCountry(item); setShowCountryModal(false); setSearchCountry(''); }}><Text style={[styles.modalOptionText, { color: theme.text }]}>{item}</Text></TouchableOpacity>
              )} />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCountryModal(false)}><Text style={styles.modalCloseText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Activity</Text>
            {EXERCISE_OPTIONS.map((option, index) => (
              <TouchableOpacity key={index} style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => { setEditExercise(option); setShowExerciseModal(false); }}><Text style={[styles.modalOptionText, { color: theme.text }]}>{option}</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowExerciseModal(false)}><Text style={styles.modalCloseText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  editButtonText: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF' },
  
  infoCard: { borderRadius: 20, padding: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#7B61FF' },
  nameText: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  emailText: { fontSize: 14, marginBottom: 15 }, 

  editInputLine: { fontSize: 16, fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 5, textAlign: 'center', width: '80%', paddingVertical: 2 },
  editGridInput: { fontSize: 14, fontWeight: 'bold', color: '#7B61FF', borderBottomWidth: 1, borderBottomColor: 'transparent', marginBottom: 2, textAlign: 'center', width: '90%' }, 
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  metricBox: { width: '48%', padding: 12, borderRadius: 15, alignItems: 'center', marginBottom: 12, height: 75, justifyContent: 'center' },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF', marginBottom: 4 },
  metricLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  
  genderToggleRow: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', marginBottom: 4 },
  miniGenderBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginHorizontal: 2 },
  miniGenderActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  miniGenderText: { fontSize: 14, fontWeight: 'bold' },
  miniGenderTextActive: { color: '#FFF' },

  bottomControls: { gap: 10, marginTop: 'auto' },
  secondaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 15, borderWidth: 1 },
  secondaryBtnText: { fontWeight: 'bold', fontSize: 16 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 15, borderWidth: 1, borderColor: '#FFE5E5' },
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  searchInput: { padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  passwordInput: { padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 16, textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});