import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXERCISE_OPTIONS = ["Sedentary (Little to none)", "Light (1-3 times/week)", "Moderate (3-5 times/week)", "High (5-7 times/week)", "Extreme (Heavy exercise/job)"];
const COUNTRIES = ["Argentina", "Brazil", "Canada", "France", "Germany", "Mexico", "Portugal", "Puerto Rico", "Spain", "United Kingdom", "United States"];

export default function ProfileScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  
  const [email, setEmail] = useState('Loading...');
  const [metadata, setMetadata] = useState<any>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editExercise, setEditExercise] = useState('');

  // --- MODAL STATES ---
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchCountry.toLowerCase()));

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        if (user.user_metadata) {
          setMetadata(user.user_metadata);
          setEditUserName(user.user_metadata.userName || '');
          setEditDob(user.user_metadata.dob || '');
          setEditGender(user.user_metadata.gender || '');
          setEditWeight(user.user_metadata.weight || '');
          setEditHeight(user.user_metadata.height || '');
          setEditCountry(user.user_metadata.country || '');     
          setEditExercise(user.user_metadata.exercise || '');   
        }
      }
    }
    loadUserData();
  }, []);

  function calculateAge(dobString: string) {
    if (!dobString) return '--';
    const birthday = new Date(dobString);
    if (isNaN(birthday.getTime())) return '--'; 
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // To make the exercise text fit perfectly in the grid box
  function formatExercise(text: string) {
    if (!text) return '--';
    return text.split(' ')[0]; // Just shows "Sedentary", "Light", "Moderate", etc.
  }

  async function handleSaveProfile() {
    const { data, error } = await supabase.auth.updateUser({
      data: { userName: editUserName, dob: editDob, gender: editGender, weight: editWeight, height: editHeight, country: editCountry, exercise: editExercise }
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
              <TextInput style={styles.editGridInput} value={editDob} onChangeText={setEditDob} placeholder="YYYY-MM-DD" />
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
          
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" placeholder="kg" />
            ) : (
              <Text style={styles.metricValue}>{metadata.weight ? `${metadata.weight} kg` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Weight</Text>
          </View>

          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" placeholder="cm" />
            ) : (
              <Text style={styles.metricValue}>{metadata.height ? `${metadata.height} cm` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Height</Text>
          </View>

          {/* EDITABLE COUNTRY VIA MODAL */}
          <TouchableOpacity style={styles.metricBox} disabled={!isEditing} onPress={() => setShowCountryModal(true)}>
            {isEditing ? (
              <Text style={[styles.editGridInput, { fontSize: 14, paddingTop: 5 }]}>{editCountry || 'Select'}</Text>
            ) : (
              <Text style={[styles.metricValue, { fontSize: 16 }]} numberOfLines={1}>{metadata.country || '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Country</Text>
          </TouchableOpacity>

          {/* EDITABLE EXERCISE VIA MODAL */}
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
  editGridInput: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF', borderBottomWidth: 1, borderBottomColor: '#E0E7FF', marginBottom: 5, textAlign: 'center', width: '90%' },
  
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

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  searchInput: { backgroundColor: '#F0F4FF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});