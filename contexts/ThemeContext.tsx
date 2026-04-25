import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDark: boolean;
  useSystemTheme: boolean;
  toggleSystemTheme: (value: boolean) => Promise<void>;
  toggleDarkMode: (value: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  useSystemTheme: true,
  toggleSystemTheme: async () => {},
  toggleDarkMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [isDarkManual, setIsDarkManual] = useState(false);

  // Tema real: se auto, segue o telemóvel. Se manual, segue a escolha.
  const isDark = useSystemTheme ? systemTheme === 'dark' : isDarkManual;

  // Carrega as preferências UMA única vez quando a app abre
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedSystem = await AsyncStorage.getItem('@system_theme');
        const savedDark = await AsyncStorage.getItem('@dark_mode');
        if (savedSystem !== null) setUseSystemTheme(JSON.parse(savedSystem));
        if (savedDark !== null) setIsDarkManual(JSON.parse(savedDark));
      } catch (e) {}
    }
    loadTheme();
  }, []);

  async function toggleSystemTheme(value: boolean) {
    setUseSystemTheme(value);
    await AsyncStorage.setItem('@system_theme', JSON.stringify(value));
    if (value) {
      const currentSystemDark = systemTheme === 'dark';
      setIsDarkManual(currentSystemDark);
      await AsyncStorage.setItem('@dark_mode', JSON.stringify(currentSystemDark));
    }
  }

  async function toggleDarkMode(value: boolean) {
    setIsDarkManual(value);
    setUseSystemTheme(false);
    await AsyncStorage.setItem('@system_theme', JSON.stringify(false));
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(value));
  }

  return (
    <ThemeContext.Provider value={{ isDark, useSystemTheme, toggleSystemTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);