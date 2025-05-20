import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  StatusBar,
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Appbar, FAB, Menu, Dialog, Button, Portal, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ImageCard from '../../components/image/ImageCard';
import * as folderApi from '../../services/api/folders';
import * as imageApi from '../../services/api/images';
import { getFullImagePath } from '../../services/api/client';

const { width, height } = Dimensions.get('window');

const FolderDetailScreen = () => {
  // State
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#FFC107');
  const [sortOption, setSortOption] = useState('date_desc');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Context and navigation
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get folder ID from route params
  const folderId = route.params?.folderId;
  
  if (!folderId) {
    console.error('FolderDetailScreen: No folderId provided in route params');
  }

  // Sorting options
  const sortOptions = [
    { label: 'Date (Newest)', value: 'date_desc' },
    { label: 'Date (Oldest)', value: 'date_asc' },
    { label: 'Name (A-Z)', value: 'name_asc' },
    { label: 'Name (Z-A)', value: 'name_desc' },
  ];

  // Effects
  useEffect(() => {
    if (folderId) {
      fetchFolderDetails();
    } else {
      setError('No folder ID provided');
      setLoading(false);
    }
  }, [folderId, sortOption]);

  // Fetch folder details
  const fetchFolderDetails = async () => {
    if (!folderId) {
      setError('Invalid folder ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Starting to fetch folder details for ID: ${folderId}`);
      
      // Fetch folder details
      const folderResponse = await folderApi.getFolder(folderId);
      
      // Check for nested data structure
      let folderData = null;
      if (folderResponse?.data?.data) {
        folderData = folderResponse.data.data;
      } else if (folderResponse?.data) {
        folderData = folderResponse.data;
      }
      
      if (!folderData) {
        throw new Error('No folder data received from API');
      }
      
      console.log('Successfully fetched folder details:', {
        id: folderData.id,
        name: folderData.name
      });
      
      // Validate and set defaults for required fields
      if (!folderData.name) {
        folderData.name = 'Unnamed Folder';
      }
      
      if (!folderData.color) {
        folderData.color = '#FFC107';
      }
      
      setFolder(folderData);
      setEditName(folderData.name);
      setEditDescription(folderData.description || '');
      setEditColor(folderData.color || '#FFC107');
      
      // Fetch folder images
      console.log(`Fetching images for folder ID: ${folderId}`);
      const imagesResponse = await imageApi.getFolderImages(folderId, 1, sortOption);
      
      if (!imagesResponse?.data) {
        console.error('Images response data is missing');
        setImages([]);
        return;
      }
      
      // Handle different response structures
      let imagesList = [];
      if (imagesResponse.data.data) {
        // Paginated response
        imagesList = imagesResponse.data.data;
      } else if (Array.isArray(imagesResponse.data)) {
        // Direct array response
        imagesList = imagesResponse.data;
      }
      
      console.log(`Fetched ${imagesList.length} images`);
      
      // Process images to ensure paths are correct and add IDs if missing
      const processedImages = imagesList.map((img, index) => {
        // Create a safe copy of the image
        const safeImg = { ...img };
        
        // Ensure ID exists
        if (!safeImg.id) {
          safeImg.id = `temp-image-${index}`;
        }
        
        // Save original path if it exists
        if (safeImg.path) {
          safeImg._originalPath = safeImg._originalPath || safeImg.path;
          
          // Ensure path is a full URL
          safeImg.path = getFullImagePath(safeImg.path);
        } else {
          // Set default path if missing
          const PLACEHOLDER_IMAGE = require('../../assets/images/Logo.png');
        }
        
        // Set default name if missing
        if (!safeImg.name) {
          safeImg.name = `Image ${index + 1}`;
        }
        
        return safeImg;
      });
      
      setImages(processedImages);
    } catch (error) {
      console.error('Error fetching folder details:', error);
      
      // Provide a more detailed error message
      let errorMessage = 'Failed to load folder details';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `: Server responded with ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += ': No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFolderDetails();
  };

  // Handle edit folder
  const handleEditFolder = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      setError(null);
      const response = await folderApi.updateFolder(folderId, {
        name: editName,
        description: editDescription,
        color: editColor,
      });
      
      // Handle different response structures
      let updatedFolder = null;
      if (response?.data?.data) {
        updatedFolder = response.data.data;
      } else if (response?.data) {
        updatedFolder = response.data;
      }
      
      if (!updatedFolder) {
        throw new Error('No updated folder data received');
      }
      
      setFolder(updatedFolder);
      setEditDialogVisible(false);
    } catch (err) {
      console.error('Error updating folder:', err);
      Alert.alert('Error', 'Failed to update folder');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    try {
      setError(null);
      const response = await folderApi.toggleFavoriteFolder(folderId);
      
      // Handle different response structures
      let updatedFolder = null;
      if (response?.data?.data) {
        updatedFolder = response.data.data;
      } else if (response?.data) {
        updatedFolder = response.data;
      }
      
      if (!updatedFolder) {
        throw new Error('No updated folder data received');
      }
      
      setFolder(updatedFolder);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Handle delete folder
  const handleDeleteFolder = () => {
    Alert.alert(
      'Delete Folder',
      'Are you sure you want to delete this folder? It will be moved to trash.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setError(null);
              await folderApi.deleteFolder(folderId);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting folder:', err);
              Alert.alert('Error', 'Failed to delete folder');
            }
          },
        },
      ]
    );
  };

  // Handle add image
  const handleAddImage = () => {
    navigation.navigate('Camera', { folderId });
  };
const handleImageAction = async (action, imageId, data) => {
  console.log(`Performing action ${action} on image ${imageId}`);
  
  switch (action) {
    case 'delete':
      try {
        setLoading(true);
        await imageApi.deleteImage(imageId);
        
        // Update local state by filtering out the deleted image
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        
        Alert.alert('Success', 'Image moved to trash');
      } catch (error) {
        console.error('Error deleting image:', error);
        Alert.alert('Error', 'Failed to delete image. Please try again.');
      } finally {
        setLoading(false);
      }
      break;
      
    case 'edit':
      try {
        if (!data || !data.name) {
          Alert.alert('Error', 'Invalid image data provided');
          return;
        }
        
        setLoading(true);
        const response = await imageApi.updateImage(imageId, data);
        
        // Extract updated image data from response
        let updatedImage = null;
        if (response.data && response.data.data) {
          updatedImage = response.data.data;
        } else if (response.data) {
          updatedImage = response.data;
        }
        
        if (updatedImage) {
          // Update image in state
          setImages(prevImages => 
            prevImages.map(img => 
              img.id === imageId ? { ...img, ...updatedImage } : img
            )
          );
          
          Alert.alert('Success', 'Image updated successfully');
        } else {
          // If we couldn't extract the updated image data, refetch all images
          handleRefresh();
        }
      } catch (error) {
        console.error('Error updating image:', error);
        Alert.alert('Error', 'Failed to update image. Please try again.');
      } finally {
        setLoading(false);
      }
      break;
      
    case 'toggleFavorite':
      try {
        setLoading(true);
        const response = await imageApi.toggleFavoriteImage(imageId);
        
        // Extract updated image data from response
        let updatedImage = null;
        if (response.data && response.data.data) {
          updatedImage = response.data.data;
        } else if (response.data) {
          updatedImage = response.data;
        }
        
        if (updatedImage) {
          // Update image in state
          setImages(prevImages => 
            prevImages.map(img => 
              img.id === imageId ? { 
                ...img, 
                is_favorite: updatedImage.is_favorite ?? !img.is_favorite 
              } : img
            )
          );
        } else {
          // If we couldn't extract the updated image data, toggle locally
          setImages(prevImages => 
            prevImages.map(img => 
              img.id === imageId ? { ...img, is_favorite: !img.is_favorite } : img
            )
          );
        }
      } catch (error) {
        console.error('Error toggling favorite status:', error);
        Alert.alert('Error', 'Failed to update favorite status. Please try again.');
      } finally {
        setLoading(false);
      }
      break;
      
    default:
      console.warn(`Unknown image action: ${action}`);
  }
};

  // Handle image press
  const handleImagePress = (imageId) => {
    if (!imageId) {
      console.warn('Attempted to navigate to image without ID');
      Alert.alert('Error', 'Invalid image selected');
      return;
    }
    
    navigation.navigate('ImageDetail', { imageId });
  };

  // Render item for FlatList
const renderItem = ({ item }) => {
  if (!item) {
    console.warn('Undefined item passed to renderItem');
    return null;
  }
  
  return (
    <ImageCard
      image={item}
      onPress={() => handleImagePress(item.id)}
      onImageAction={handleImageAction}
    />
  );
};
  // Key extractor for FlatList
  const keyExtractor = (item) => {
    if (!item || !item.id) {
      console.warn('Item without ID passed to keyExtractor:', item);
      return `fallback-${Math.random().toString(36).substr(2, 9)}`;
    }
    return item.id.toString();
  };

  // Empty list component
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, {backgroundColor: 'rgba(255, 193, 7, 0.1)'}]}>
        <Ionicons name="images-outline" size={80} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyText, { color: theme.colors.text }]}>
        No images found in this folder
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddImage}
      >
        <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.emptyButtonText}>Add Image</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading folder...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Something went wrong</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
          onPress={fetchFolderDetails}
        >
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If folder is null or undefined, show error state
  if (!folder) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="help-circle" size={60} color={theme.colors.primary} />
        <Text style={[styles.errorTitle, { color: theme.colors.primary }]}>Folder Not Found</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
          We couldn't find the requested folder.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: folder.color || theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title={folder.name} color="#fff" />
        <Appbar.Action
          icon={folder.is_favorite ? 'star' : 'star-outline'}
          color="#fff"
          onPress={handleToggleFavorite}
        />
        <Appbar.Action
          icon="dots-vertical"
          color="#fff"
          onPress={() => setMenuVisible(true)}
        />
      </Appbar.Header>

      {/* Menus */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: width - 40, y: 60 }}
        style={[styles.menu, { backgroundColor: theme.colors.card }]}
      >
        <Menu.Item
          title="Edit Folder"
          leadingIcon="pencil"
          onPress={() => {
            setMenuVisible(false);
            setEditDialogVisible(true);
          }}
        />
        <Menu.Item
          title="Delete Folder"
          leadingIcon="delete"
          onPress={() => {
            setMenuVisible(false);
            handleDeleteFolder();
          }}
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>

      <Menu
        visible={sortMenuVisible}
        onDismiss={() => setSortMenuVisible(false)}
        anchor={{ x: width - 40, y: 120 }}
        style={[styles.menu, { backgroundColor: theme.colors.card }]}
      >
        {sortOptions.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            leadingIcon={sortOption === option.value ? 'check' : 'sort'}
            onPress={() => {
              setSortOption(option.value);
              setSortMenuVisible(false);
            }}
          />
        ))}
      </Menu>
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Folder info section */}
        {folder.description ? (
          <View style={[styles.descriptionContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
              {folder.description}
            </Text>
          </View>
        ) : null}

        {/* Sort button */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.card }]}
            onPress={() => setSortMenuVisible(true)}
          >
            <Ionicons name="filter-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
              {sortOptions.find(option => option.value === sortOption)?.label || 'Sort'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image grid */}
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Add image FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="camera"
        onPress={handleAddImage}
        color="#fff"
      />

      {/* Edit folder dialog */}
      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card, borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: theme.colors.text, textAlign: 'center' }}>Edit Folder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Folder Name"
              placeholderTextColor={theme.colors.disabled}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { borderColor: theme.colors.border, color: theme.colors.text }
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.disabled}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
            />
            
            {/* Color selection */}
            <Text style={[styles.colorLabel, { color: theme.colors.text }]}>Folder Color</Text>
            <View style={styles.colorContainer}>
              {['#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#607D8B'].map(color => (
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)} textColor={theme.colors.text}>
              Cancel
            </Button>
            <Button 
              onPress={handleEditFolder} 
              mode="contained"
              buttonColor={theme.colors.primary + '20'}
              textColor={theme.colors.primary}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  descriptionContainer: {
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 5,
    paddingBottom: 80,
  },
  menu: {
    width: 200,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  colorLabel: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default FolderDetailScreen;