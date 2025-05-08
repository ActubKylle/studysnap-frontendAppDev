// File: src/components/image/ImageCard.jsx
import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width / 2) - 15; // For 2 columns with padding

// Important: No require() calls here! We'll use uri: null as a fallback

const ImageCard = ({ image, onPress, disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

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

  // Safety check for image
  if (!image) {
    console.warn('Null or undefined image passed to ImageCard');
    return null;
  }

  // Determine image source safely - always use URI format for all images
  const getImageSource = () => {
    if (!image.path) {
      console.warn('Image missing path:', image);
      return { uri: null }; // Empty URI, will trigger the onError handler
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
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
});

export default ImageCard;