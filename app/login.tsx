import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, useColorScheme } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXERCISE_OPTIONS = [
  "Sedentary (Little to none)", 
  "Light (1-3 times/week)", 
  "Moderate (3-5 times/week)", 
  "High (5-7 times/week)", 
  "Extreme (Heavy exercise/job)"
];

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", 
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", 
    "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", 
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", 
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", 
    "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", 
    "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", 
    "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", 
    "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", 
    "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", 
    "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", 
    "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", 
    "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", 
    "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", 
    "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", 
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", 
    "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", 
    "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", 
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", 
    "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", 
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
    "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", 
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
    "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
    "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", 
    "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", 
    "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", 
    "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
    "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", 
    "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // --- DARK MODE SETUP ---
  const systemTheme = useColorScheme();
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [isDarkManual, setIsDarkManual] = useState(false);

  // Determine actual theme: if Auto is on, follow the phone. Otherwise, follow manual choice.
  const isDark = useSystemTheme ? systemTheme === 'dark' : isDarkManual;

  const theme = {
    background: isDark ? '#121212' : '#F9F9FB',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#A0A0A0' : '#888888',
    card: isDark ? '#1E1E1E' : '#F0F4FF',
    inputBg: isDark ? '#2C2C2E' : '#FFFFFF',
    border: isDark ? '#333333' : '#E0E7FF',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(''); 
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [country, setCountry] = useState('');   
  const [exercise, setExercise] = useState(''); 

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchCountry.toLowerCase()));

  // 1. Load the Theme when the App Opens
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedSystem = await AsyncStorage.getItem('@system_theme');
        const savedDark = await AsyncStorage.getItem('@dark_mode');
        
        if (savedSystem !== null) setUseSystemTheme(JSON.parse(savedSystem));
        if (savedDark !== null) setIsDarkManual(JSON.parse(savedDark));
      } catch (e) {
        console.log("Failed to load theme");
      }
    }
    loadTheme();
  }, [systemTheme]);

  // 2. The Button Cycle Function (Auto -> Dark -> Light -> Auto)
  async function cycleTheme() {
    if (useSystemTheme) {
      // From Auto -> Dark Mode
      setUseSystemTheme(false);
      setIsDarkManual(true);
      await AsyncStorage.setItem('@system_theme', JSON.stringify(false));
      await AsyncStorage.setItem('@dark_mode', JSON.stringify(true));
    } else if (isDarkManual) {
      // From Dark Mode -> Light Mode
      setIsDarkManual(false);
      await AsyncStorage.setItem('@dark_mode', JSON.stringify(false));
    } else {
      // From Light Mode -> Auto
      setUseSystemTheme(true);
      await AsyncStorage.setItem('@system_theme', JSON.stringify(true));
    }
  }

  // Get the right label and icon for the current mode
  const themeLabel = useSystemTheme ? "Auto" : (isDarkManual ? "Dark" : "Light");
  const themeIcon = useSystemTheme ? "phone-portrait-outline" : (isDarkManual ? "moon" : "sunny");

  function handleDobChange(text: string) {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    if (cleaned.length > 6) formatted = formatted.substring(0, 7) + '-' + cleaned.substring(6, 8);
    setDob(formatted);
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!userName) return Alert.alert("Missing Info", "Please enter a User Name.");
    if (!gender) return Alert.alert("Missing Info", "Please select a gender.");
    if (!country || !exercise) return Alert.alert("Missing Info", "Please select a Country and Exercise Level.");
    
    if (dob.length !== 10) return Alert.alert("Invalid Date", "Please enter a complete date (YYYY-MM-DD).");
    
    const dobDate = new Date(dob);
    const today = new Date();

    if (isNaN(dobDate.getTime()) || dobDate > today) {
      return Alert.alert("Invalid Date", "Please enter a valid date in the past.");
    }

    const [year, month, day] = dob.split('-');
    if (
      dobDate.getUTCFullYear() !== parseInt(year) ||
      dobDate.getUTCMonth() + 1 !== parseInt(month) ||
      dobDate.getUTCDate() !== parseInt(day)
    ) {
      return Alert.alert("Invalid Date", "This date does not exist on the calendar.");
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email: email, 
      password: password,
      options: {
        data: { userName, dob, gender, weight, height, country, exercise }
      }
    });

    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* THEME CYCLE BUTTON */}
      <View style={styles.topRow}>
        <TouchableOpacity style={[styles.themePill, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={cycleTheme}>
          <Ionicons name={themeIcon} size={16} color={theme.text} />
          <Text style={[styles.themePillText, { color: theme.text }]}>{themeLabel}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.header, { color: theme.text }]}>{isSignUpMode ? 'Create Account' : 'Welcome Back'}</Text>
      <Text style={[styles.subtitle, { color: theme.subtext }]}>{isSignUpMode ? 'Enter your details to calculate your water target' : 'Log in to track your hydration'}</Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} 
          placeholderTextColor={theme.subtext}
          placeholder="brooklyn@example.com" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} 
          placeholderTextColor={theme.subtext}
          placeholder="Enter password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          autoCapitalize="none" 
        />
      </View>

      {isSignUpMode &&(
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>User Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} 
            placeholderTextColor={theme.subtext}
            placeholder="Enter your username" 
            value={userName} 
            onChangeText={setUserName} 
            autoCapitalize="words" 
          />
        </View>
      )}

      {isSignUpMode && (
        <View style={[styles.metricsBox, { backgroundColor: theme.card }]}>
          <Text style={styles.metricsHeader}>Personal Metrics</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Date of Birth</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} 
                placeholderTextColor={theme.subtext}
                placeholder="YYYY-MM-DD" 
                value={dob} 
                onChangeText={handleDobChange} 
                keyboardType="numeric" 
                maxLength={10} 
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity style={[styles.genderButton, { backgroundColor: theme.inputBg, borderColor: theme.border }, gender === 'M' && styles.genderButtonActive]} onPress={() => setGender('M')}>
                  <Text style={[styles.genderText, { color: theme.text }, gender === 'M' && styles.genderTextActive]}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.genderButton, { backgroundColor: theme.inputBg, borderColor: theme.border }, gender === 'F' && styles.genderButtonActive]} onPress={() => setGender('F')}>
                  <Text style={[styles.genderText, { color: theme.text }, gender === 'F' && styles.genderTextActive]}>F</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholderTextColor={theme.subtext} placeholder="e.g. 70" value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholderTextColor={theme.subtext} placeholder="e.g. 175" value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Country</Text>
            <TouchableOpacity style={[styles.dropdownInput, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setShowCountryModal(true)}>
              <Text style={{ color: country ? theme.text : theme.subtext, fontSize: 16 }}>{country || 'Select Country'}</Text>
              <Ionicons name="chevron-down" size={20} color="#7B61FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Activity Level</Text>
            <TouchableOpacity style={[styles.dropdownInput, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setShowExerciseModal(true)}>
              <Text style={{ color: exercise ? theme.text : theme.subtext, fontSize: 16 }}>{exercise || 'Select Activity Level'}</Text>
              <Ionicons name="chevron-down" size={20} color="#7B61FF" />
            </TouchableOpacity>
          </View>

        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={isSignUpMode ? signUpWithEmail : signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{isSignUpMode ? 'Sign Up & Save Data' : 'Log In'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.card }]} onPress={() => setIsSignUpMode(!isSignUpMode)} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{isSignUpMode ? 'Already have an account? Log In' : 'New here? Create Account'}</Text>
        </TouchableOpacity>
      </View>

      {/* MODALS */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Country</Text>
            <TextInput style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text }]} placeholderTextColor={theme.subtext} placeholder="Type to search (e.g., Po)" value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            <FlatList 
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => { setCountry(item); setShowCountryModal(false); setSearchCountry(''); }}>
                  <Text style={[styles.modalOptionText, { color: theme.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Activity Level</Text>
            {EXERCISE_OPTIONS.map((option, index) => (
              <TouchableOpacity key={index} style={[styles.modalOption, { borderBottomColor: theme.border }]} onPress={() => { setExercise(option); setShowExerciseModal(false); }}>
                <Text style={[styles.modalOptionText, { color: theme.text }]}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 25, justifyContent: 'center', paddingVertical: 50 },
  
  // --- NEW THEME PILL STYLES ---
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  themePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  themePillText: { marginLeft: 6, fontSize: 14, fontWeight: '600' },

  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1 },
  metricsBox: { padding: 15, borderRadius: 15, marginBottom: 20 },
  metricsHeader: { fontSize: 18, fontWeight: 'bold', color: '#7B61FF', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginHorizontal: 4 },
  genderButtonActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  genderText: { fontSize: 16, fontWeight: '500' },
  genderTextActive: { color: '#FFF', fontWeight: 'bold' },
  buttonContainer: { marginTop: 10 },
  primaryButton: { backgroundColor: '#7B61FF', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { padding: 18, borderRadius: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#7B61FF', fontSize: 16, fontWeight: 'bold' },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  searchInput: { padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 16, textAlign: 'center' },
  modalCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#FFE5E5', borderRadius: 12, alignItems: 'center' },
  modalCloseText: { color: '#FF4B4B', fontWeight: 'bold', fontSize: 16 }
});