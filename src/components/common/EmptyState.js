import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

const EmptyState = ({ 
  icon = 'document-outline', 
  title = 'No Items', 
  message = 'Nothing to show here yet.' 
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={theme.colors.disabled} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.disabled }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default EmptyState;