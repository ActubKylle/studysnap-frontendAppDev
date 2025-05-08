// File: src/components/folder/FolderCard.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

const FolderCard = ({ folder, onPress, disabled = false }) => {
  const { theme } = useContext(ThemeContext);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Safety check for folder
  if (!folder) {
    console.warn('Null or undefined folder passed to FolderCard');
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        disabled && styles.disabledContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.topSection}>
        <View style={[styles.folderIcon, { backgroundColor: folder.color || theme.colors.primary }]}>
          <Ionicons name="folder-open" size={32} color="#FFF" />
        </View>
        
        {folder.is_favorite && (
          <View style={styles.favoriteIcon}>
            <Ionicons name="star" size={16} color="#FFC107" />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.folderName, { color: theme.colors.text }]} 
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {folder.name || 'Unnamed Folder'}
        </Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="image-outline" size={14} color={theme.colors.disabled} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: theme.colors.disabled }]}>
              {folder.images_count || 0} item{(folder.images_count !== 1) ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.disabled} style={styles.metaIcon} />
            <Text style={[styles.metaText, { color: theme.colors.disabled }]}>
              {formatDate(folder.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 5,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledContainer: {
    opacity: 0.7,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    padding: 12,
    paddingTop: 4,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaContainer: {
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
  },
  favoriteIcon: {
    marginTop: 4,
  },
});

export default FolderCard;