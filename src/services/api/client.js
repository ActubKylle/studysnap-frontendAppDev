// File: src/services/apiClient.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API Base URL - Use your server address
const API_BASE_URL = '10.0.254.15:8000'; // Your current IP address
const API_PROTOCOL = 'http'; // or 'https' for production

// Export the full base URL for use elsewhere
export const BASE_URL = `${API_PROTOCOL}://${API_BASE_URL}`;
export const API_URL = `${BASE_URL}/api/`; // Note the trailing slash

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Fix for double slash issue
const fixEndpointPath = (path) => {
  // If path already starts with a slash, remove the slash to prevent double slashes
  if (path.startsWith('/')) {
    return path.substring(1);
  }
  return path;
};

// Add request interceptor to add auth token and fix URL paths
apiClient.interceptors.request.use(
  async (config) => {
    // Fix double slash issue in URLs
    if (config.url) {
      config.url = fixEndpointPath(config.url);
    }
    
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add debug logging in development
    if (__DEV__) {
      console.log(
        `API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data
      );
    }
    
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Add debug logging in development
    if (__DEV__) {
      console.log('API Response Success:', response.status, response.config.url);
      
      // Log the response data structure for debugging
      console.log('Response data structure:', Object.keys(response.data));
      
      // Debug image paths if present
      if (response.data && (response.config.url.includes('images') || response.config.url.includes('folders'))) {
        if (response.data.data) {
          // For collection responses
          console.log('Collection data:', response.data.data.length, 'items');
          if (response.data.data.length > 0) {
            console.log('First item structure:', Object.keys(response.data.data[0]));
          }
        } else if (response.data.id) {
          // For single item responses
          console.log('Single item data:', { id: response.data.id, ...Object.keys(response.data) });
        } else {
          // For unexpected response structures
          console.log('Unexpected response structure:', response.data);
        }
      }
    }
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and handle logout
      await SecureStore.deleteItemAsync('token');
      // You might want to redirect to login here or handle it in your auth context
    }
    
    if (__DEV__) {
      console.error('API Response Error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // More detailed network error debugging
      if (!error.response) {
        console.error('Network Error Details:', {
          isNetworkError: error.isAxiosError && !error.response,
          timeout: error.code === 'ECONNABORTED',
          code: error.code,
          message: error.message
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Image path helpers

/**
 * Get a full URL for an image path
 * @param {string} path - The image path to format
 * @returns {string|null} The formatted image URL
 */
export const getFullImagePath = (path) => {
  if (!path) return null;
  
  // If path is already a complete URI, use it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // For local files from camera
  if (path.startsWith('file://')) {
    return path;
  }
  
  // For storage paths from Laravel
  if (path.startsWith('/storage/')) {
    return `${API_PROTOCOL}://${API_BASE_URL}${path}`;
  }
  
  // For paths from the backend that might be missing the base URL
  return path.startsWith('/') 
    ? `${API_PROTOCOL}://${API_BASE_URL}${path}` 
    : `${API_PROTOCOL}://${API_BASE_URL}/${path}`;
};

/**
 * Create FormData for image upload
 * @param {object} imageData - Image data with uri
 * @param {object} additionalData - Additional form data to include
 * @returns {FormData} The formatted form data for upload
 */
export const createImageFormData = (imageData, additionalData = {}) => {
  const formData = new FormData();
  
  // Add all additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });
  
  // If image data was provided, add it
  if (imageData && imageData.uri) {
    // Extract filename and extension
    const uri = imageData.uri;
    const filenameParts = uri.split('/');
    const filename = filenameParts[filenameParts.length - 1];
    
    // Get file extension and determine MIME type
    const fileExtension = filename.split('.').pop().toLowerCase();
    let mimeType;
    
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      default:
        mimeType = 'image/jpeg'; // Default to jpeg
    }
    
    // Format the URI based on platform if needed
    const formattedUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    
    // Add the image to the form data
    formData.append('image', {
      uri: formattedUri,
      name: filename,
      type: mimeType,
    });
    
    console.log('Image data for upload:', {
      uri: formattedUri,
      name: filename,
      type: mimeType
    });
  }
  
  return formData;
};

// Debug utility to check image loading
export const debugImageUrl = (url) => {
  if (!url) {
    console.log('DEBUG: Image URL is null or undefined');
    return;
  }
  
  console.log('DEBUG: Testing image URL:', url);
  
  // Create a test Image object to check if URL is valid
  const testImage = new Image();
  
  testImage.onload = () => {
    console.log('DEBUG: Image URL is valid:', url);
  };
  
  testImage.onerror = (error) => {
    console.error('DEBUG: Invalid image URL:', url, error);
  };
  
  testImage.src = url;
};

export default apiClient;