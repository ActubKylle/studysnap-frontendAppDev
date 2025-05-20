import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { ThemeContext } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width / 2) - 15; 

const ImageCard = ({ image, onPress, onImageAction, disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [longPressAnim] = useState(new Animated.Value(1));

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

  if (!image) {
    console.warn('Null or undefined image passed to ImageCard');
    return null;
  }

  const getImageSource = () => {
    if (!image.path) {
      console.warn('Image missing path:', image);
      return { uri: null }; 
    }
    
    // Handle string paths - most common case
    if (typeof image.path === 'string') {
      // Ensure it starts with http for API images
      if (image.path.startsWith('http')) {
        return { uri: image.path };
      } else {
        // Could be a relative path from the API
        try {
          // Try to form a full URL if it's a relative path
          return { uri: image.path };
        } catch (error) {
          console.warn('Error with image path format:', image.path);
          return { uri: null };
        }
      }
    }
    
    // If image.path is an object (from require), convert to string URI
    // This is not recommended but provides a fallback
    if (typeof image.path === 'object' && image.path !== null) {
      console.warn('Object-based image path detected, this may cause issues');
      try {
        // Try to use the URI property if it exists
        if (image.path.uri) {
          return { uri: image.path.uri };
        }
        return { uri: null };
      } catch (error) {
        console.warn('Error handling object-based image path');
        return { uri: null };
      }
    }
    
    // Final fallback
    return { uri: null };
  };

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
    
    // Initialize edit form with current image name
    setEditName(image.name || '');
    
    // Show edit modal
    setEditModalVisible(true);
  };
  
  // Handle save edit
  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Image name cannot be empty');
      return;
    }
    
    setEditModalVisible(false);
    
    // Call the parent handler with edit action and data
    if (onImageAction) {
      onImageAction('edit', image.id, {
        name: editName
      });
    }
  };
  
  // Handle delete action
  const handleDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete Image',
      `Are you sure you want to delete "${image.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onImageAction) {
              onImageAction('delete', image.id);
            }
          }
        }
      ]
    );
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    setActionModalVisible(false);
    if (onImageAction) {
      onImageAction('toggleFavorite', image.id);
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={() => !disabled && onPress(image.id)}
        onLongPress={handleLongPress}
        onPressIn={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={500}
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
          <View style={styles.imageWrapper}>
            <Image 
              source={getImageSource()}
              style={styles.image} 
              resizeMode="cover"
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError(true);
              }}
            />
            
            {/* Dark overlay for better text visibility */}
            <View style={styles.imageDarkOverlay} />
            
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            
            {error && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle" size={24} color="#FFF" />
                <Text style={styles.errorText}>Image not available</Text>
              </View>
            )}
            
            {/* Favorite indicator */}
            {image.is_favorite && (
              <View style={styles.favoriteIcon}>
                <Ionicons name="star" size={16} color="#FFC107" />
              </View>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <Text 
              style={[styles.imageName, { color: theme.colors.text }]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {image.name || 'Untitled Image'}
            </Text>
            <View style={styles.metaContainer}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.disabled} style={styles.metaIcon} />
              <Text style={[styles.imageDate, { color: theme.colors.disabled }]}>
                {formatDate(image.created_at)}
              </Text>
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
              Image Actions
            </Text>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Rename Image
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={image.is_favorite ? "star" : "star-outline"} 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {image.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={24} color={theme.colors.error} />
              <Text style={[styles.actionText, { color: theme.colors.error }]}>
                Delete Image
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
              Rename Image
            </Text>
            
            <TextInput
              placeholder="Image Name"
              placeholderTextColor={theme.colors.disabled}
              value={editName}
              onChangeText={setEditName}
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }
              ]}
            />
            
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
  cardWrapper: {
    width: cardWidth,
    marginHorizontal: 5,
    marginBottom: 15,
  },
  container: {
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
  imageWrapper: {
    position: 'relative',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageDarkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 12,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 12,
  },
  infoContainer: {
    padding: 12,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  imageDate: {
    fontSize: 12,
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 0.48,
  },
});

export default ImageCard;