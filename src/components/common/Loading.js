import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';

const Loading = ({ message = 'Loading...' }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default Loading;
