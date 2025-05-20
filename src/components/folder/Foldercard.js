import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Pressable,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button } from 'react-native-paper';
import { ThemeContext } from '../../contexts/ThemeContext';

const FolderCard = ({ folder, onPress, onFolderAction, disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const [longPressAnim] = useState(new Animated.Value(1));
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  
  // Color options for edit modal
  const colorOptions = [
    '#FFC107', // Yellow (default)
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#F44336', // Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
  ];
  
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
  
  // Animation for when long press starts
  const handleLongPressIn = () => {
    Animated.spring(longPressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  
  // Animation for when long press ends
  const handleLongPressOut = () => {
    Animated.spring(longPressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle long press to show action modal
  const handleLongPress = () => {
    if (!disabled) {
      setActionModalVisible(true);
    }
  };
  
  // Handle edit action
  const handleEdit = () => {
    setActionModalVisible(false);
    
    // Initialize edit form with current folder values
    setEditName(folder.name || '');
    setEditDescription(folder.description || '');
    setEditColor(folder.color || '#FFC107');
    
    // Show edit modal
    setEditModalVisible(true);
  };
  
  // Handle save edit
  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Folder name cannot be empty');
      return;
    }
    
    setEditModalVisible(false);
    
    // Call the parent handler with edit action and data
    if (onFolderAction) {
      onFolderAction('edit', folder.id, {
        name: editName,
        description: editDescription,
        color: editColor
      });
    }
  };
  
  // Handle delete action
  const handleDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onFolderAction) {
              onFolderAction('delete', folder.id);
            }
          }
        }
      ]
    );
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    setActionModalVisible(false);
    if (onFolderAction) {
      onFolderAction('toggleFavorite', folder.id);
    }
  };

  return (
    <View style={styles.containerWrapper}>
      <Pressable
        onPress={() => !disabled && onPress(folder)}
        onLongPress={handleLongPress}
        onPressIn={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={500} // Adjust timing for longpress
        disabled={disabled}
      >
        <Animated.View 
          style={[
            styles.container,
            { backgroundColor: theme.colors.card },
            disabled && styles.disabledContainer,
            { transform: [{ scale: longPressAnim }] }
          ]}
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
        </Animated.View>
      </Pressable>
      
      {/* Action Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActionModalVisible(false)}
        >
          <View 
            style={[
              styles.actionModal, 
              { backgroundColor: theme.colors.card }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Folder Actions
            </Text>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Edit Folder
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={folder.is_favorite ? "star" : "star-outline"} 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {folder.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={24} color={theme.colors.error} />
              <Text style={[styles.actionText, { color: theme.colors.error }]}>
                Delete Folder
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: theme.colors.card }]} 
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalContainer}>
          <View style={[styles.editModal, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.editModalTitle, { color: theme.colors.text }]}>
              Edit Folder
            </Text>
            
            <TextInput
              label="Folder Name"
              value={editName}
              onChangeText={setEditName}
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            
            <TextInput
              label="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
              style={[styles.input, { backgroundColor: theme.colors.background, minHeight: 100 }]}
              multiline
              numberOfLines={4}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            
            <Text style={[styles.colorLabel, { color: theme.colors.text }]}>
              Folder Color
            </Text>
            
            <View style={styles.colorContainer}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editColor === color && styles.colorSelected
                  ]}
                  onPress={() => setEditColor(color)}
                />
              ))}
            </View>
            
            <View style={styles.editButtonsContainer}>
              <Button 
                mode="outlined" 
                onPress={() => setEditModalVisible(false)}
                style={[styles.editButton, { borderColor: theme.colors.primary }]}
                textColor={theme.colors.primary}
              >
                Cancel
              </Button>
              
              <Button 
                mode="contained" 
                onPress={handleSaveEdit}
                style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
                textColor="#FFF"
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'relative',
    width: '48%',
    marginHorizontal: 5,
    marginBottom: 15,
  },
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
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
  
  // Action Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editModal: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  colorLabel: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 0.48,
  },
});

export default FolderCard;