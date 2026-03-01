import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  
  const [email, setEmail] = useState('Loading...');
  const [metadata, setMetadata] = useState<any>({});

  // --- ALL EDIT MODE STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        if (user.user_metadata) {
          setMetadata(user.user_metadata);
          // Pre-fill ALL the edit boxes with current data
          setEditUserName(user.user_metadata.userName || '');
          setEditWeight(user.user_metadata.weight || '');
          setEditHeight(user.user_metadata.height || '');
          setEditDob(user.user_metadata.dob || '');
          setEditGender(user.user_metadata.gender || '');
        }
      }
    }
    loadUserData();
  }, []);

  function calculateAge(dobString: string) {
    if (!dobString) return '--';
    const birthday = new Date(dobString);
    if (isNaN(birthday.getTime())) return '--'; // Protect against bad dates
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  async function handleSaveProfile() {
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        userName: editUserName,
        weight: editWeight,
        height: editHeight,
        dob: editDob,       // <-- Now saving DOB changes
        gender: editGender  // <-- Now saving Gender changes
      }
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setMetadata(data.user.user_metadata); 
      setIsEditing(false); 
      Alert.alert("Success", "All profile metrics updated!");
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

        {/* --- FULLY EDITABLE METRICS GRID --- */}
        <View style={styles.metricsGrid}>
          
          {/* DOB / Age Box */}
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editDob} onChangeText={setEditDob} placeholder="YYYY-MM-DD" />
            ) : (
              <Text style={styles.metricValue}>{calculateAge(metadata.dob)}</Text>
            )}
            <Text style={styles.metricLabel}>{isEditing ? 'Birth Date' : 'Age'}</Text>
          </View>

          {/* Gender Box */}
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
          
          {/* Weight Box */}
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" placeholder="kg" />
            ) : (
              <Text style={styles.metricValue}>{metadata.weight ? `${metadata.weight} kg` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Weight</Text>
          </View>

          {/* Height Box */}
          <View style={styles.metricBox}>
            {isEditing ? (
              <TextInput style={styles.editGridInput} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" placeholder="cm" />
            ) : (
              <Text style={styles.metricValue}>{metadata.height ? `${metadata.height} cm` : '--'}</Text>
            )}
            <Text style={styles.metricLabel}>Height</Text>
          </View>

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
  emailText: { fontSize: 14, color: '#555', marginBottom: 4 },
  phoneText: { fontSize: 14, color: '#888', marginBottom: 20 },

  editInputLine: { fontSize: 18, fontWeight: 'bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#E0E7FF', marginBottom: 10, textAlign: 'center', width: '80%', paddingVertical: 5 },
  editGridInput: { fontSize: 16, fontWeight: 'bold', color: '#7B61FF', borderBottomWidth: 1, borderBottomColor: '#E0E7FF', marginBottom: 5, textAlign: 'center', width: '80%' },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginTop: 15 },
  metricBox: { width: '47%', backgroundColor: '#F9F9FB', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10, height: 80, justifyContent: 'center' },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginBottom: 5 },
  metricLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  
  // Styles for the mini M/F buttons in the grid
  genderToggleRow: { flexDirection: 'row', width: '80%', justifyContent: 'space-between', marginBottom: 5 },
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
  logoutText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});