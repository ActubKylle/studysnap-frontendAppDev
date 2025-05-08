// File: src/screens/image/CameraScreen.js
import React, { useState, useEffect, useContext } from 'react';
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
import * as imageApi from '../../services/api/images';
import { createImageFormData } from '../../services/api/client';

const { width } = Dimensions.get('window');

const CameraScreen = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { folderId } = route.params || {};

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (capturedImage) {
          cancelCapture();
          return true;
        }
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [capturedImage])
  );

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        console.log('Camera permission:', cameraPermission.status);
        console.log('Media library permission:', libraryPermission.status);
        
        if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Please grant camera and photo library permissions to use this feature.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    })();
  }, []);

  const takePicture = async () => {
    try {
      console.log('Opening camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      console.log('Camera result:', JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image captured successfully (new format)');
        setCapturedImage(result.assets[0]);
      } else if (!result.cancelled && result.uri) {
        // Handle older ImagePicker API response format
        console.log('Image captured successfully (old format)');
        setCapturedImage(result);
      } else {
        console.log('Camera capture canceled');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      console.log('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      console.log('Image picker result:', JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image picked successfully (new format)');
        setCapturedImage(result.assets[0]);
      } else if (!result.cancelled && result.uri) {
        // Handle older ImagePicker API response format
        console.log('Image picked successfully (old format)');
        setCapturedImage(result);
      } else {
        console.log('Image picking canceled');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery: ' + error.message);
    }
  };

  const uploadImage = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'No image to upload');
      return;
    }

    if (!folderId) {
      Alert.alert('Error', 'Folder ID is missing. Cannot upload image.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Preparing to upload image to folder:', folderId);
      
      // Format the data for upload using our helper function
      const formData = createImageFormData(
        capturedImage,
        {
          folder_id: folderId,
          name: `Image ${new Date().toLocaleString()}`,
        }
      );
      
      console.log('Uploading image...');
      
      // Upload the image using our API service
      const response = await imageApi.uploadImage(formData);
      console.log('Upload successful! Image ID:', response.data.id);
      
      // Navigate back to folder detail
      console.log('Navigating back to folder detail with ID:', folderId);
      navigation.navigate('FolderDetail', { folderId });
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      Alert.alert('Error', 'Failed to upload image: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const cancelCapture = () => {
    console.log('Canceling capture');
    setCapturedImage(null);
  };

  const handleGoBack = () => {
    console.log('Navigating back to:', folderId ? 'FolderDetail' : 'TabNavigator');
    if (folderId) {
      navigation.navigate('FolderDetail', { folderId });
    } else {
      navigation.navigate('TabNavigator');
    }
  };

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
            <Text style={styles.loadingText}>Uploading image...</Text>
          </View>
        ) : (
          <View style={styles.captureActions}>
            <TouchableOpacity style={styles.captureActionButton} onPress={cancelCapture}>
              <Ionicons name="close-circle" size={60} color="#FFF" />
              <Text style={styles.actionButtonLabel}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureActionButton} onPress={uploadImage}>
              <Ionicons name="checkmark-circle" size={60} color="#FFF" />
              <Text style={styles.actionButtonLabel}>Upload</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleGoBack}
      >
        <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <Ionicons name="camera-outline" size={100} color={theme.colors.primary} />
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Take or Select an Image
        </Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={takePicture}
        >
          <Ionicons name="camera-outline" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Take a Picture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.primary, marginTop: 15 }]}
          onPress={pickImage}
        >
          <Ionicons name="images-outline" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.cancelButton, { borderColor: theme.colors.primary, marginTop: 20 }]}
          onPress={handleGoBack}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>
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