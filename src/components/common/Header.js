import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

const Header = ({ title, leftIcon, rightIcon, onLeftPress, onRightPress }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      {leftIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onLeftPress}>
          <Ionicons name={leftIcon} size={24} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
          <Ionicons name={rightIcon} size={24} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default Header;
