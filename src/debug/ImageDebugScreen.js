// File: src/screens/debug/ImageDebugScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Button,
  SafeAreaView,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { API_BASE_URL, getFullImageUrl } from '../../services/config';
import * as imageApi from '../../services/api/images';

const ImageDebugScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const [imageUrl, setImageUrl] = useState('');
  const [testPath, setTestPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageInfo, setImageInfo] = useState(null);
  
  // Get image ID from route params if available
  const { imageId } = route.params || {};
  
  useEffect(() => {
    // If an image ID was passed, load that image
    if (imageId) {
      loadImageById(imageId);
    }
  }, [imageId]);
  
  const loadImageById = async (id) => {
    setLoading(true);
    setImageError(false);
    setErrorMessage('');
    
    try {
      const response = await imageApi.getImage(id);
      const imageData = response.data;
      
      setImageInfo(imageData);
      setImageUrl(imageData.path);
      
      // Add the raw path to test path for comparison
      if (imageData._originalPath) {
        setTestPath(imageData._originalPath);
      } else {
        setTestPath(imageData.path);
      }
      
    } catch (error) {
      console.error('Error loading image by ID:', error);
      setImageError(true);
      setErrorMessage(`Failed to load image ID ${id}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testImage = () => {
    setImageLoaded(false);
    setImageError(false);
    
    // Convert the test path to a full URL
    const fullUrl = getFullImageUrl(testPath);
    setImageUrl(fullUrl);
  };
  
  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    alert('Copied to clipboard');
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const handleImageError = (error) => {
    console.error('Image loading error:', error.nativeEvent.error);
    setImageError(true);
    setImageLoaded(false);
    setErrorMessage(`Failed to load image: ${error.nativeEvent.error}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Image Debug Tool
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Image Preview Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Image Preview
          </Text>
          
          <View style={styles.imageContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : imageUrl ? (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  resizeMode="contain"
                />
                
                {imageError && (
                  <View style={styles.errorOverlay}>
                    <Ionicons name="alert-circle-outline" size={50} color="#fff" />
                    <Text style={styles.errorText}>Image Failed to Load</Text>
                  </View>
                )}
                
                {imageLoaded && (
                  <View style={styles.successOverlay}>
                    <Ionicons name="checkmark-circle-outline" size={30} color="#4CAF50" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={80} color="#ddd" />
                <Text style={[styles.noImageText, { color: theme.colors.disabled }]}>
                  Enter an image path to test
                </Text>
              </View>
            )}
          </View>
          
          {imageError && errorMessage && (
            <View style={styles.errorMessageContainer}>
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>
          )}
          
          {imageUrl && (
            <TouchableOpacity 
              style={styles.urlContainer} 
              onPress={() => copyToClipboard(imageUrl)}
            >
              <Text style={styles.urlLabel}>Current URL:</Text>
              <Text style={styles.url} numberOfLines={2}>{imageUrl}</Text>
              <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Image Test Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Test Image Path
          </Text>
          
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border }]}
            value={testPath}
            onChangeText={setTestPath}
            placeholder="Enter image path to test"
            placeholderTextColor={theme.colors.disabled}
            multiline
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testImage}
            >
              <Text style={styles.buttonText}>Test Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#f44336' }]}
              onPress={() => setImageUrl('')}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Image Info Section */}
        {imageInfo && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Image Details
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>ID:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{imageInfo.id}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Name:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{imageInfo.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Original Path:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(imageInfo._originalPath || imageInfo.path)}>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={2}>
                  {imageInfo._originalPath || imageInfo.path}
                </Text>
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Created:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {new Date(imageInfo.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        
        {/* Debug Info Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Debug Info
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text }]}>API Base URL:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
              {API_BASE_URL}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Full Test URL:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={2}>
              {getFullImageUrl(testPath)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary, alignSelf: 'center', marginTop: 20 }]}
            onPress={() => {
              // Reset test values and reload image if we have an ID
              if (imageId) {
                loadImageById(imageId);
              } else {
                setImageUrl('');
                setTestPath('');
                setImageInfo(null);
              }
            }}
          >
            <Text style={styles.buttonText}>Reset / Reload</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  successOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 4,
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorMessageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFCDD2',
    borderRadius: 4,
  },
  errorMessageText: {
    color: '#B71C1C',
    fontSize: 12,
  },
  urlContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  urlLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  url: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
  copyIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export default ImageDebugScreen;
