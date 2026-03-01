import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXERCISE_OPTIONS = ["Sedentary (Little to none)", "Light (1-3 times/week)", "Moderate (3-5 times/week)", "High (5-7 times/week)", "Extreme (Heavy exercise/job)"];
const COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

export default function ProfileScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  
  const [email, setEmail] = useState('Loading...');
  const [metadata, setMetadata] = useState<any>({});

  // --- NEW STATE FOR UNIT PREFERENCE ---
  const [isMetric, setIsMetric] = useState(true); // true = kg/cm, false = lbs/in

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

// --- THE NEW FOCUS EFFECT ---
  useFocusEffect(
    useCallback(() => {
      async function loadUserData() {
        // 1. Fetch unit preference from Settings
        try {
          const savedUnit = await AsyncStorage.getItem('@use_kg');
          if (savedUnit !== null) {
            setIsMetric(JSON.parse(savedUnit));
          }
        } catch (e) {
          console.log("Failed to load unit settings");
        }

        // 2. Fetch Supabase Data
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
    const ageDate = new Date(ageDifMs); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  function formatExercise(text: string) {
    if (!text) return '--';
    return text.split(' ')[0]; 
  }

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
      const today = new Date();
      if (isNaN(dobDate.getTime()) || dobDate > today) return Alert.alert("Invalid Date", "Please enter a valid date in the past.");
      const [year, month, day] = editDob.split('-');
      if (dobDate.getUTCFullYear() !== parseInt(year) || dobDate.getUTCMonth() + 1 !== parseInt(month) || dobDate.getUTCDate() !== parseInt(day)) {
        return Alert.alert("Invalid Date", "This date does not exist on the calendar.");
      }
    }

    // --- THE MATH: Convert BACK to Metric before saving to the database ---
    let weightToSave = editWeight;
    let heightToSave = editHeight;

    if (!isMetric) {
      // If they typed in Lbs/Inches, turn it back to Kg/Cm for the database
      if (editWeight) weightToSave = (parseFloat(editWeight) / 2.20462).toFixed(1).toString();
      if (editHeight) heightToSave = (parseFloat(editHeight) / 0.393701).toFixed(1).toString();
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { userName: editUserName, dob: editDob, gender: editGender, weight: weightToSave, height: heightToSave, country: editCountry, exercise: editExercise }
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setMetadata(data.user.user_metadata); 
      setIsEditing(false); 
      Alert.alert("Success", "Profile metrics updated!");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) return Alert.alert("Weak Password", "Must be at least 6 characters.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Password updated!");
    setNewPassword('');
  }

  const firstLetter = metadata.userName ? metadata.userName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  // --- THE MATH: Display Values for View Mode ---
  const displayWeight = isMetric 
    ? metadata.weight 
    : metadata.weight ? (parseFloat(metadata.weight) * 2.20462).toFixed(1) : '--';
  
  const displayHeight = isMetric 
    ? metadata.height 
    : metadata.height ? (parseFloat(metadata.height) * 0.393701).toFixed(1) : '--';

  const weightUnitLabel = isMetric ? "kg" : "lbs";
  const heightUnitLabel = isMetric ? "cm" : "in";

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        
        {isEditing ? (
          <>
            <TextInput style={styles.editInputLine} value={editUserName} onChangeText={setEditUserName} placeholder="Username" />
            <Text style={styles.emailText}>{email}</Text>
          </>
        ) : (
          <>
            <Text style={styles.nameText}>{metadata.userName || 'No Username'}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </>
        )}

        <View style={styles.metricsGrid}>
          
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editDob} onChangeText={handleEditDobChange} placeholder="YYYY-MM-DD" keyboardType="numeric" maxLength={10} />
            ) : (
              <Text style={styles.metricValue}>{calculateAge(metadata.dob)}</Text>
            )}
            <Text style={styles.metricLabel}>{isEditing ? 'Birth Date' : 'Age'}</Text>
          </View>

          <View style={styles.metricBox}>
            {isEditing ? (
              <View style={styles.genderToggleRow}>
                <TouchableOpacity style={[styles.miniGenderBtn, editGender === 'M' && styles.miniGenderActive]} onPress={() => setEditGender('M')}>
                  <Text style={[styles.miniGenderText, editGender === 'M' && styles.miniGenderTextActive]}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.miniGenderBtn, editGender === 'F' && styles.miniGenderActive]} onPress={() => setEditGender('F')}>
                  <Text style={[styles.miniGenderText, editGender === 'F' && styles.miniGenderTextActive]}>F</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.metricValue}>{metadata.gender || '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Gender</Text>
          </View>
          
          {/* DYNAMIC WEIGHT BOX */}
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" placeholder={weightUnitLabel} />
            ) : (
              <Text style={styles.metricValue}>{displayWeight !== '--' ? `${displayWeight} ${weightUnitLabel}` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Weight</Text>
          </View>

          {/* DYNAMIC HEIGHT BOX */}
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" placeholder={heightUnitLabel} />
            ) : (
              <Text style={styles.metricValue}>{displayHeight !== '--' ? `${displayHeight} ${heightUnitLabel}` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Height</Text>
          </View>

          <TouchableOpacity style={styles.metricBox} disabled={!isEditing} onPress={() => setShowCountryModal(true)}>
            {isEditing ? (
              <Text style={[styles.editGridInput, { fontSize: 14, paddingTop: 5 }]}>{editCountry || 'Select'}</Text>
            ) : (
              <Text style={[styles.metricValue, { fontSize: 16 }]} numberOfLines={1}>{metadata.country || '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Country</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricBox} disabled={!isEditing} onPress={() => setShowExerciseModal(true)}>
            {isEditing ? (
              <Text style={[styles.editGridInput, { fontSize: 14, paddingTop: 5 }]}>{formatExercise(editExercise) || 'Select'}</Text>
            ) : (
              <Text style={[styles.metricValue, { fontSize: 16 }]} numberOfLines={1}>{formatExercise(metadata.exercise)}</Text>
            )}
            <Text style={styles.metricLabel}>Activity</Text>
          </TouchableOpacity>

        </View>
      </View>

      {!isEditing && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Update Password</Text>
            <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TouchableOpacity style={styles.saveButton} onPress={handlePasswordChange}>
              <Text style={styles.saveText}>Save New Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- COUNTRY SEARCH MODAL --- */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TextInput style={styles.searchInput} placeholder="Type to search (e.g., Po)" value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            <FlatList 
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => { setEditCountry(item); setShowCountryModal(false); setSearchCountry(''); }}>
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EXERCISE SELECT MODAL --- */}
      <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Activity Level</Text>
            {EXERCISE_OPTIONS.map((option, index) => (
              <TouchableOpacity key={index} style={styles.modalOption} onPress={() => { setEditExercise(option); setShowExerciseModal(false); }}>
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', paddingHorizontal: 25, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  editButtonText: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF' },
  
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#7B61FF' },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  emailText: { fontSize: 14, color: '#555', marginBottom: 20 }, 

  editInputLine: { fontSize: 18, fontWeight: 'bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#E0E7FF', marginBottom: 10, textAlign: 'center', width: '80%', paddingVertical: 5 },
  editGridInput: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF', borderBottomWidth: 1, borderBottomColor: '#E0E7FF', marginBottom: 5, textAlign: 'center', width: '100%' }, 
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  metricBox: { width: '47%', backgroundColor: '#F9F9FB', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15, height: 80, justifyContent: 'center' },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginBottom: 5 },
  metricLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  
  genderToggleRow: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', marginBottom: 5 },
  miniGenderBtn: { flex: 1, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E0E7FF', alignItems: 'center', marginHorizontal: 2 },
  miniGenderActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  miniGenderText: { fontSize: 14, color: '#555', fontWeight: 'bold' },
  miniGenderTextActive: { color: '#FFF' },

  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 25 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  input: { backgroundColor: '#F9F9FB', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', marginBottom: 15, fontSize: 16 },
  saveButton: { backgroundColor: '#7B61FF', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  logoutButton: { alignItems: 'center', padding: 18, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FFE5E5' },
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  searchInput: { backgroundColor: '#F0F4FF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});