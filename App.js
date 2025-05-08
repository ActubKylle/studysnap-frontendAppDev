import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PaperProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </PaperProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}