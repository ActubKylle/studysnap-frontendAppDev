import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as imageApi from '../../services/api/images';
import { createImageFormData } from '../../services/api/client';

const { width } = Dimensions.get('window');
const MAX_IMAGE_SIZE = 1900000; // Set max size to ~1.9MB to stay under 2MB limit
const MAX_DIMENSION = 1200; // Max width/height 1200px
const SAFETY_TIMEOUT = 5000; // 5 seconds

const CameraScreen = () => {
  // States for UI and operation management
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Refs for tracking operation states that don't need re-renders
  const uploadingRef = useRef(false);
  const navigationTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { folderId } = route.params || {};

  // Ensure component is mounted before state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear any pending timeouts on unmount
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to safely update state only if component is mounted
  const safeSetState = useCallback((setter, value) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  // Reset all operation states
  const resetAllStates = useCallback(() => {
    if (mountedRef.current) {
      safeSetState(setIsNavigating, false);
      safeSetState(setLoading, false);
      safeSetState(setProcessingImage, false);
      uploadingRef.current = false;
      
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    }
  }, [safeSetState]);

  // Add a safety timeout to reset states if they get stuck
  useEffect(() => {
    if (isNavigating || loading || processingImage || uploadingRef.current) {
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('Safety timeout: resetting operation states');
        resetAllStates();
      }, SAFETY_TIMEOUT);
      
      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }
  }, [isNavigating, loading, processingImage, resetAllStates]);

  // Check operation state
  const isOperationInProgress = useCallback(() => {
    return loading || processingImage || isNavigating || uploadingRef.current;
  }, [loading, processingImage, isNavigating]);

  // Reset states when focus is lost (navigating away)
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      console.log('Screen lost focus - resetting all states');
      resetAllStates();
    });

    return unsubscribe;
  }, [navigation, resetAllStates]);

  // Reset navigation state when screen gets focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen gained focus - resetting navigation state');
      safeSetState(setIsNavigating, false);
      uploadingRef.current = false;
      return () => {};
    }, [safeSetState])
  );

  // Handle Android back button with improved logic
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log('Back button pressed', { 
          isNavigating, 
          loading, 
          processingImage, 
          uploading: uploadingRef.current 
        });

        // Critical operation in progress - don't allow back
        if (loading || processingImage || uploadingRef.current) {
          console.log('Critical operation in progress - blocking back button');
          return true;
        }
        
        // Already navigating - prevent duplicate navigation
        if (isNavigating) {
          console.log('Already navigating - preventing duplicate back action');
          return true;
        }
        
        if (capturedImage) {
          console.log('Captured image detected - handling with replace navigation');
          handleCaptureCancel();
          return true;
        }
        
        // Ready to navigate back using replace
        console.log('Handling back button with replace navigation');
        handleNavigateBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [capturedImage, isNavigating, loading, processingImage])
  );

  // Request camera permissions on mount
  useEffect(() => {
    if (mountedRef.current) {
      requestPermissions();
    }
  }, []);

  // Request camera and media library permissions
  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to use this feature.',
          [{ 
            text: 'OK', 
            onPress: () => {
              safeSetState(setIsNavigating, true);
              navigation.goBack();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions');
    }
  };

  // Process and optimize image
  const processImage = async (imageResult) => {
    if (!imageResult || imageResult.canceled || 
        (imageResult.assets && imageResult.assets.length === 0)) {
      console.log('Image capture/selection canceled or empty result');
      return null;
    }
    
    try {
      safeSetState(setProcessingImage, true);
      
      // Extract image asset from different possible response formats
      let imageAsset = null;
      if (imageResult.assets && imageResult.assets.length > 0) {
        imageAsset = imageResult.assets[0];
      } else if (imageResult.uri) {
        imageAsset = imageResult;
      } else {
        console.log('Unrecognized image result format');
        safeSetState(setProcessingImage, false);
        return null;
      }
      
      console.log('Original image size:', imageAsset.fileSize, 'bytes');
      
      // If image is already small enough, return it as is
      if (imageAsset.fileSize && imageAsset.fileSize < MAX_IMAGE_SIZE) {
        console.log('Image is small enough, no need to resize');
        safeSetState(setProcessingImage, false);
        return imageAsset;
      }
      
      // Calculate optimal compression quality based on original size
      let quality = 0.8; // Default quality
      if (imageAsset.fileSize > 5000000) { // 5MB+
        quality = 0.5;
      } else if (imageAsset.fileSize > 3000000) { // 3MB+
        quality = 0.6;
      } else {
        quality = 0.7;
      }
      
      // Calculate resize dimensions while maintaining aspect ratio
      let width = imageAsset.width || 1000;
      let height = imageAsset.height || 1000;
      
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
      
      console.log(`Resizing image to ${width}x${height} with quality ${quality}`);
      
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [{ resize: { width, height } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Add file size if it's missing
      if (!manipResult.fileSize) {
        const estimatedSize = Math.round(width * height * quality * 0.15);
        manipResult.fileSize = estimatedSize;
        console.log('Estimated processed size:', estimatedSize, 'bytes');
      } else {
        console.log('Actual processed size:', manipResult.fileSize, 'bytes');
      }
      
      if (!mountedRef.current) return null;
      safeSetState(setProcessingImage, false);
      return manipResult;
    } catch (error) {
      console.error('Error processing image:', error);
      if (mountedRef.current) {
        safeSetState(setProcessingImage, false);
        Alert.alert('Error', 'Failed to process image');
      }
      return null;
    }
  };

  // Take picture using camera
  const takePicture = async () => {
    if (isOperationInProgress()) {
      console.log('Operation in progress, ignoring take picture request');
      return;
    }
    
    try {
      console.log('Opening camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        aspect: undefined,
      });

      if (!mountedRef.current) return;
      
      // Process image before setting state
      const processedImage = await processImage(result);
      if (processedImage && mountedRef.current) {
        console.log('Image captured and processed successfully');
        safeSetState(setCapturedImage, processedImage);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to take picture: ' + error.message);
      }
    }
  };

  // Select image from gallery
  const pickImage = async () => {
    if (isOperationInProgress()) {
      console.log('Operation in progress, ignoring pick image request');
      return;
    }
    
    try {
      console.log('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        aspect: undefined,
      });

      if (!mountedRef.current) return;
      
      // Process image before setting state
      const processedImage = await processImage(result);
      if (processedImage && mountedRef.current) {
        console.log('Image selected and processed successfully');
        safeSetState(setCapturedImage, processedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to pick image from gallery: ' + error.message);
      }
    }
  };

  // Upload image to server
  const uploadImage = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'No image to upload');
      return;
    }

    if (!folderId) {
      Alert.alert('Error', 'Folder ID is missing. Cannot upload image.');
      return;
    }

    if (isOperationInProgress()) {
      console.log('Operation in progress, ignoring upload request');
      return;
    }

    safeSetState(setLoading, true);
    uploadingRef.current = true;
    
    try {
      console.log('Preparing to upload image to folder:', folderId);
      
      // Create form data for upload
      const formData = createImageFormData(
        capturedImage,
        {
          folder_id: folderId,
          name: `Image ${new Date().toLocaleString()}`,
        }
      );
      
      console.log('Uploading image...');
      
      // Upload image
      const response = await imageApi.uploadImage(formData);
      
      // Extract image ID from response
      let imageId = null;
      if (response.data?.data?.id) {
        imageId = response.data.data.id;
      } else if (response.data?.id) {
        imageId = response.data.id;
      }
      
      console.log('Upload successful! Image ID:', imageId);
      
      if (!mountedRef.current) return;
      
      // Mark as navigating and reset states before navigation
      safeSetState(setIsNavigating, true);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      // Use replace to improve navigation flow
      navigation.replace('FolderDetail', {
        folderId: folderId,
        refresh: true,
        timestamp: Date.now() // Force refresh
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (!mountedRef.current) return;
      
      // Show user-friendly error message
      if (error.response?.status === 413) {
        Alert.alert(
          'Image Too Large', 
          'The image is still too large to upload. Please try using a different image.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Upload Failed', 
          'Unable to save your image. Please try again later.',
          [{ text: 'OK' }]
        );
      }
      
      // Reset flags to allow retry
      resetAllStates();
    }
  };

  // Handle canceling captured image
  const handleCaptureCancel = useCallback(() => {
    if (isOperationInProgress()) {
      console.log('Operation in progress, ignoring cancel request');
      return;
    }
    
    if (capturedImage && folderId) {
      console.log('Canceling capture and replacing with folder detail');
      safeSetState(setIsNavigating, true);
      
      // Replace current screen in the navigation stack
      navigation.replace('FolderDetail', { 
        folderId: folderId
      });
    } else {
      // Just clear the captured image if we're in the initial camera screen
      console.log('Canceling capture, clearing image');
      safeSetState(setCapturedImage, null);
    }
  }, [capturedImage, folderId, isOperationInProgress, navigation, safeSetState]);

  // Handle navigation back
  const handleNavigateBack = useCallback(() => {
    if (isOperationInProgress()) {
      console.log('Operation in progress, ignoring back request');
      return;
    }
    
    console.log('Handling navigation back');
    safeSetState(setIsNavigating, true);
    
    // Use replace instead of goBack for better UX
    if (folderId) {
      navigation.replace('FolderDetail', { folderId });
    } else {
      navigation.goBack();
    }
  }, [folderId, isOperationInProgress, navigation, safeSetState]);

  // Image processing overlay
  if (processingImage) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: '#FFF' }]}>
            Optimizing image...
          </Text>
        </View>
      </View>
    );
  }

  // Image preview and action buttons
  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Image 
          source={{ uri: capturedImage.uri }} 
          style={styles.previewImage} 
          onError={(e) => console.error('Preview image error:', e.nativeEvent.error)}
        />
        
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Saving image...</Text>
          </View>
        ) : (
          <View style={styles.captureActions}>
            <TouchableOpacity 
              style={[
                styles.captureActionButton,
                isOperationInProgress() ? styles.disabledButton : null
              ]} 
              onPress={handleCaptureCancel}
              disabled={isOperationInProgress()}
            >
              <Ionicons name="close-circle" size={60} color="#FFF" />
              <Text style={styles.actionButtonLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.captureActionButton,
                isOperationInProgress() ? styles.disabledButton : null
              ]} 
              onPress={uploadImage}
              disabled={isOperationInProgress()}
            >
              <Ionicons name="checkmark-circle" size={60} color="#FFF" />
              <Text style={styles.actionButtonLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Initial camera options screen
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity 
        style={[
          styles.backButton,
          isOperationInProgress() ? styles.disabledButton : null
        ]} 
        onPress={handleNavigateBack}
        disabled={isOperationInProgress()}
      >
        <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <Ionicons name="camera-outline" size={100} color={theme.colors.primary} />
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Add an Image
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: theme.colors.primary },
            isOperationInProgress() ? styles.disabledActionButton : null
          ]}
          onPress={takePicture}
          disabled={isOperationInProgress()}
        >
          <Ionicons name="camera-outline" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Take a Picture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: theme.colors.primary, marginTop: 15 },
            isOperationInProgress() ? styles.disabledActionButton : null
          ]}
          onPress={pickImage}
          disabled={isOperationInProgress()}
        >
          <Ionicons name="images-outline" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.cancelButton, 
            { borderColor: theme.colors.primary, marginTop: 20 },
            isOperationInProgress() ? styles.disabledCancelButton : null
          ]}
          onPress={handleNavigateBack}
          disabled={isOperationInProgress()}
        >
          <Text style={[
            styles.cancelButtonText, 
            { color: theme.colors.primary },
            isOperationInProgress() ? { color: theme.colors.disabled } : null
          ]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    justifyContent: 'center',
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
  },
  disabledCancelButton: {
    borderColor: '#CCC',
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  captureActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  captureActionButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonLabel: {
    color: '#FFF',
    marginTop: 5,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default CameraScreen;