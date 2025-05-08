import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import lightTheme from '../theme/lightTheme';
import darkTheme from '../theme/darkTheme';
export const ThemeContext = createContext();


export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme === 'dark') {
          setIsDarkMode(true);
          setTheme(darkTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    try {
      const newIsDarkMode = !isDarkMode;
      setIsDarkMode(newIsDarkMode);
      setTheme(newIsDarkMode ? darkTheme : lightTheme);
      await AsyncStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme,
        loading,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
