// File: src/screens/image/ImageDetailScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  SafeAreaView,
  Share,
} from 'react-native';
import { Appbar, Menu, TextInput, Button, Portal, Dialog, Chip, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as imageApi from '../../services/api/images';

const { width, height } = Dimensions.get('window');

// Error boundary component to catch rendering errors
const ErrorFallback = ({ error, resetError, theme }) => (
  <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
    <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
    <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Something went wrong</Text>
    <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
      {error?.message || "We couldn't display this image"}
    </Text>
    <TouchableOpacity
      style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
      onPress={resetError}
    >
      <Text style={styles.errorButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const ImageDetailScreen = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState('');
  const [scrollY] = useState(new Animated.Value(0));
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Check if route params exist and contain imageId
  const imageId = route.params?.imageId;
  
  if (!imageId) {
    console.error('ImageDetailScreen: No imageId provided in route params');
  }

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const infoTranslate = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp'
  });

  // Safe loading of image details with error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      if (!imageId) {
        setError('No image ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        setRenderError(null);
        
        console.log(`Fetching image details for ID: ${imageId}`);
        const response = await imageApi.getImage(imageId);
        
        // Add this logging to see the response structure
        console.log('Image detail response structure:', 
          response && response.data ? Object.keys(response.data) : 'No data');
        
        // Handle possible nested data structure
        let imageData = null;
        
        if (response?.data?.data) {
          imageData = response.data.data;
        } else if (response?.data) {
          imageData = response.data;
        }
        
        if (!imageData) {
          throw new Error('No image data found in the response');
        }
        
        // Log the extracted data
        console.log('Image data extracted:', {
          id: imageData.id || 'missing ID',
          name: imageData.name || 'missing name',
          hasPath: !!imageData.path
        });
        
        // Validate required fields
        if (!imageData.path) {
          console.warn('Image missing required path field:', imageData);
          imageData.path = '/api/placeholder/400/300'; // Fallback image path
        }
        
        if (!imageData.name) {
          imageData.name = 'Untitled Image';
        }
        
        if (!imageData.created_at) {
          imageData.created_at = new Date().toISOString();
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setImage(imageData);
          setEditName(imageData.name);
          setEditDescription(imageData.description || '');
        }
      } catch (err) {
        console.error('Error fetching image details:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load image details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchImage();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [imageId]);

  const handleEditImage = async () => {
    if (!editName.trim()) {
      setError('Please enter an image name');
      return;
    }

    try {
      setError('');
      console.log(`Updating image ${imageId} with name: ${editName}`);
      
      const response = await imageApi.updateImage(imageId, {
        name: editName,
        description: editDescription,
      });
      
      console.log('Update image response:', response?.data ? 'success' : 'no data');
      
      let updatedImage = null;
      if (response?.data?.data) {
        updatedImage = response.data.data;
      } else if (response?.data) {
        updatedImage = response.data;
      }
      
      if (!updatedImage) {
        throw new Error('Failed to get updated image data');
      }
      
      // Preserve the image path if it's missing in the response
      if (!updatedImage.path && image?.path) {
        updatedImage.path = image.path;
      }
      
      setImage(updatedImage);
      setEditDialogVisible(false);
      setError('');
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Failed to update image: ' + (err.message || 'Unknown error'));
    }
  };

  const handleToggleFavorite = async () => {
    if (!imageId) {
      setError('Cannot update: Invalid image ID');
      return;
    }
    
    try {
      setError('');
      const response = await imageApi.toggleFavoriteImage(imageId);
      
      let updatedImage = null;
      if (response?.data?.data) {
        updatedImage = response.data.data;
      } else if (response?.data) {
        updatedImage = response.data;
      }
      
      if (!updatedImage) {
        throw new Error('Failed to get updated favorite status');
      }
      
      // Preserve the image path if it's missing in the response
      if (!updatedImage.path && image?.path) {
        updatedImage.path = image.path;
      }
      
      setImage(updatedImage);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleDeleteImage = () => {
    if (!imageId) {
      setError('Cannot delete: Invalid image ID');
      return;
    }
    
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? It will be moved to trash.',
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
              setError('');
              await imageApi.deleteImage(imageId);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting image:', err);
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const toggleFullscreenMode = () => {
    setFullscreenMode(!fullscreenMode);
  };

  const handleShareImage = async () => {
    if (!image?.path) {
      setError('Cannot share: Image path is missing');
      return;
    }

    try {
      setError('');
      const result = await Share.share({
        message: `Check out this image: ${image.name || 'Image'}`,
        url: image.path
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const resetRenderError = () => {
    setRenderError(null);
    setError('');
    fetchImageDetails();
  };
  
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
  
  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'Unknown time';
      const date = new Date(dateString);
      return date.toLocaleTimeString();
    } catch (error) {
      console.warn('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  // Function to safely fetch image details
  const fetchImageDetails = async () => {
    if (!imageId) {
      setError('No image ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await imageApi.getImage(imageId);
      
      // Handle possible nested data structure
      let imageData = null;
      if (response?.data?.data) {
        imageData = response.data.data;
      } else if (response?.data) {
        imageData = response.data;
      }
      
      if (!imageData) {
        throw new Error('No image data found in the response');
      }
      
      // Validate required fields
      if (!imageData.path) {
        console.warn('Image missing required path field:', imageData);
        imageData.path = '/api/placeholder/400/300'; // Fallback image path
      }
      
      if (!imageData.name) {
        imageData.name = 'Untitled Image';
      }
      
      setImage(imageData);
      setEditName(imageData.name);
      setEditDescription(imageData.description || '');
    } catch (err) {
      console.error('Error fetching image details:', err);
      setError(err.message || 'Failed to load image details');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading image...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !imageId) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Something went wrong</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
          {error || "We couldn't load this image"}
        </Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
          onPress={fetchImageDetails}
        >
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Show render error state
  if (renderError) {
    return (
      <ErrorFallback 
        error={renderError} 
        resetError={resetRenderError} 
        theme={theme} 
      />
    );
  }

  // If image is null or undefined, show error state
  if (!image) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="help-circle" size={60} color={theme.colors.primary} />
        <Text style={[styles.errorTitle, { color: theme.colors.primary }]}>Image Not Found</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
          We couldn't find the requested image.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fullscreen mode view
  if (fullscreenMode) {
    return (
      <View style={[styles.fullscreenContainer, { backgroundColor: '#000' }]}>
        <StatusBar hidden />
        <TouchableOpacity 
          style={styles.fullscreenImage} 
          activeOpacity={0.9}
          onPress={toggleFullscreenMode}
        >
          <Image
            source={{ uri: image.path }}
            style={styles.fullscreenImageContent}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeFullscreenButton} onPress={toggleFullscreenMode}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // Main component render - wrapped in try/catch for safety
  try {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.header, 
            {
              opacity: headerOpacity,
              backgroundColor: theme.colors.primary
            }
          ]}
        >
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
          <Appbar.Content title={image.name || 'Untitled Image'} color="#fff" />
          <Appbar.Action
            icon={image.is_favorite ? 'star' : 'star-outline'}
            color="#fff"
            onPress={handleToggleFavorite}
          />
          <Appbar.Action icon="dots-vertical" color="#fff" onPress={() => setMenuVisible(true)} />
        </Animated.View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={[styles.menu, { backgroundColor: theme.colors.card }]}
        >
          <Menu.Item
            title="Edit Details"
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false);
              setEditDialogVisible(true);
            }}
          />
          <Menu.Item
            title="Share Image"
            leadingIcon="share"
            onPress={() => {
              setMenuVisible(false);
              handleShareImage();
            }}
          />
          <Menu.Item
            title="Delete Image"
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              handleDeleteImage();
            }}
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>

        <ScrollView 
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            style={styles.imageContainer}
            activeOpacity={0.9}
            onPress={toggleFullscreenMode}
          >
            <Image
              source={{ uri: image.path }}
              style={styles.image}
              resizeMode="contain"
              defaultSource={require('../../assets/placeholder-image.png')} // Add a placeholder image
            />
            <View style={styles.zoomIconContainer}>
              <Ionicons name="expand-outline" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.infoContainer, 
              { 
                backgroundColor: theme.colors.card,
                transform: [{ translateY: infoTranslate }] 
              }
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={[styles.imageTitle, { color: theme.colors.text }]}>
                {image.name || 'Untitled Image'}
              </Text>
              {image.is_favorite && (
                <Ionicons name="star" size={22} color="#FFC107" />
              )}
            </View>
            
            {image.description ? (
              <Text style={[styles.imageDescription, { color: theme.colors.text }]}>
                {image.description}
              </Text>
            ) : null}

            <View style={styles.metadataContainer}>
              <Text style={[styles.metadataTitle, { color: theme.colors.primary }]}>Metadata</Text>
              
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="folder-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.metaText, { color: theme.colors.text }]}>
                    Folder: {image.folder?.name || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.metaText, { color: theme.colors.text }]}>
                    Created: {formatDate(image.created_at)}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.metaText, { color: theme.colors.text }]}>
                    Time: {formatTime(image.created_at)}
                  </Text>
                </View>
                
                {image.updated_at && image.updated_at !== image.created_at && (
                  <View style={styles.metaItem}>
                    <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.metaText, { color: theme.colors.text }]}>
                      Last Updated: {formatDate(image.updated_at)}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.tagContainer}>
                <Chip 
                  style={[styles.tagChip, { backgroundColor: theme.colors.primary + '20' }]}
                  textStyle={{ color: theme.colors.primary }}
                >
                  {image.file_type || 'JPG'}
                </Chip>
                
                {image.tags && Array.isArray(image.tags) && image.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    style={[styles.tagChip, { backgroundColor: theme.colors.primary + '10' }]}
                    textStyle={{ color: theme.colors.text }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Action buttons */}
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="pencil"
          onPress={() => setEditDialogVisible(true)}
          color="#fff"
        />

        {/* Edit image dialog */}
        <Portal>
          <Dialog
            visible={editDialogVisible}
            onDismiss={() => setEditDialogVisible(false)}
            style={{ backgroundColor: theme.colors.card, borderRadius: 20 }}
          >
            <Dialog.Title style={{ color: theme.colors.text, textAlign: 'center' }}>Edit Image Details</Dialog.Title>
            <Dialog.Content>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TextInput
                label="Image Name"
                value={editName}
                onChangeText={setEditName}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              
              <TextInput
                label="Description (optional)"
                value={editDescription}
                onChangeText={setEditDescription}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)} textColor={theme.colors.text}>
                Cancel
              </Button>
              <Button 
                onPress={handleEditImage} 
                mode="contained"
                buttonColor={theme.colors.primary + '20'}
                textColor={theme.colors.primary}
              >
                Update
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    );
  } catch (err) {
    console.error('Error rendering ImageDetailScreen:', err);
    setRenderError(err);
    return (
      <ErrorFallback 
        error={err} 
        resetError={resetRenderError} 
        theme={theme} 
      />
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: height / 2,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomIconContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageContent: {
    width: '100%',
    height: '100%',
  },
  closeFullscreenButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  infoContainer: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  imageDescription: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  metadataContainer: {
    marginTop: 16,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metaContainer: {
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 15,
    marginLeft: 12,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 200,
    borderRadius: 12,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
});

export default ImageDetailScreen;