// File: src/components/debug/ImageInspector.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getFullImagePath } from '../services/api/client';

/**
 * A debug component to help diagnose image loading issues
 * Add this to any screen where images aren't loading to see what's happening
 * 
 * Usage:
 * import ImageInspector from '../../components/debug/ImageInspector';
 * ...
 * <ImageInspector imagePath={image.path} originalPath={image._originalPath} />
 */
const ImageInspector = ({ imagePath, originalPath, title = 'Image Inspector' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Get the full URL if not already a full URL
  const fullUrl = getFullImagePath(imagePath);
  
  // Handle image load complete
  const handleLoadEnd = () => {
    setLoading(false);
  };
  
  // Handle image load error
  const handleError = (error) => {
    console.error('Image inspector error:', error.nativeEvent.error);
    setError(true);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.status, { color: error ? 'red' : 'green' }]}>
          {error ? 'Failed' : loading ? 'Loading...' : 'Success'}
        </Text>
      </TouchableOpacity>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.imageContainer}>
            {loading && (
              <ActivityIndicator 
                size="small" 
                color="#007AFF" 
                style={styles.loader} 
              />
            )}
            
            <Image
              source={{ uri: fullUrl }}
              style={styles.image}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: error ? 'red' : 'green' }]}>
                {error ? 'Failed to load' : loading ? 'Loading...' : 'Loaded successfully'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Original path:</Text>
              <Text style={styles.value} numberOfLines={1}>{originalPath || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Full URL:</Text>
              <Text style={styles.value} numberOfLines={1}>{fullUrl}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Is remote:</Text>
              <Text style={styles.value}>
                {fullUrl?.startsWith('http') ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
  },
  status: {
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 8,
  },
  imageContainer: {
    height: 100,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 4,
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 12,
  },
});

export default ImageInspector;