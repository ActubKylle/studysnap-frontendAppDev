// File: src/services/api/images.js
import apiClient from '../api/client';
import { getFullImagePath, createImageFormData } from '../api/client';

/**
 * Get all images (with optional pagination)
 * @param {number} page - Page number
 * @param {string} sort - Sort order
 * @param {number} limit - Number of items per page
 * @returns {Promise} API response
 */
export const getAllImages = async (page = 1, sort = 'date_desc', limit = 20) => {
  try {
    const response = await apiClient.get(
      `images?page=${page}&sort=${sort}&limit=${limit}`
    );
    
    // Process image paths in the response
    if (response.data && response.data.data) {
      // Map over the data array to process each image
      response.data.data = response.data.data.map(image => ({
        ...image,
        _originalPath: image.path, // Store original for debugging
        path: getFullImagePath(image.path)
      }));
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching all images:', error);
    throw error;
  }
};

/**
 * Get images for a specific folder
 * @param {number} folderId - Folder ID
 * @param {number} page - Page number
 * @param {string} sort - Sort order
 * @param {number} limit - Number of items per page
 * @returns {Promise} API response
 */
export const getFolderImages = async (folderId, page = 1, sort = 'date_desc', limit = 20) => {
  try {
    const response = await apiClient.get(
      `folders/${folderId}/images?page=${page}&sort=${sort}&limit=${limit}`
    );
    
    // Process image paths in the response
    if (response.data && response.data.data) {
      // Map over the data array to process each image
      response.data.data = response.data.data.map(image => ({
        ...image,
        _originalPath: image.path, // Store original for debugging
        path: getFullImagePath(image.path)
      }));
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching folder images:', error);
    throw error;
  }
};

/**
 * Get a single image by ID
 * @param {number} imageId - Image ID
 * @returns {Promise} API response
 */
export const getImage = async (imageId) => {
  try {
    const response = await apiClient.get(`images/${imageId}`);
    
    // Process image path in the response
    // Handle nested data structure
    if (response.data && response.data.data) {
      // Store the original path for debugging
      response.data.data._originalPath = response.data.data.path;
      // Process the path
      response.data.data.path = getFullImagePath(response.data.data.path);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
};

/**
 * Upload a new image
 * @param {FormData|object} data - Image data or FormData
 * @returns {Promise} API response
 */
export const uploadImage = async (data) => {
  try {
    let formData;
    
    // Check if data is already FormData
    if (data instanceof FormData) {
      formData = data;
    } else if (data.image && data.folder_id) {
      // Create FormData from the provided object
      const { image, ...additionalData } = data;
      formData = createImageFormData(image, additionalData);
    } else {
      throw new Error('Invalid data format for image upload');
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response = await apiClient.post('images', formData, config);
    
    // Process image path in the response
    // Handle nested data structure
    if (response.data && response.data.data) {
      response.data.data._originalPath = response.data.data.path;
      response.data.data.path = getFullImagePath(response.data.data.path);
    }
    
    return response;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Update an existing image
 * @param {number} imageId - Image ID
 * @param {object} data - Image data to update
 * @returns {Promise} API response
 */
export const updateImage = async (imageId, data) => {
  try {
    const response = await apiClient.put(`images/${imageId}`, data);
    
    // Process image path in the response
    // Handle nested data structure
    if (response.data && response.data.data) {
      response.data.data._originalPath = response.data.data.path;
      response.data.data.path = getFullImagePath(response.data.data.path);
    }
    
    return response;
  } catch (error) {
    console.error('Error updating image:', error);
    throw error;
  }
};

/**
 * Delete an image (move to trash)
 * @param {number} imageId - Image ID
 * @returns {Promise} API response
 */
export const deleteImage = async (imageId) => {
  try {
    return await apiClient.delete(`images/${imageId}`);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Toggle favorite status
 * @param {number} imageId - Image ID
 * @returns {Promise} API response
 */
export const toggleFavoriteImage = async (imageId) => {
  try {
    console.log(`Toggling favorite status for image ${imageId}`);
    
    // First, try with the /images/{id}/favorite endpoint (RESTful pattern)
    const response = await apiClient.post(`images/${imageId}/favorite`);
    
    // If your API uses a different endpoint, update the path accordingly
    // For example:
    // const response = await apiClient.put(`images/${imageId}/favorite`);
    // const response = await apiClient.post(`images/${imageId}/toggle-favorite`);
    // const response = await apiClient.patch(`images/${imageId}`, { is_favorite: true });
    
    console.log('Image favorite status updated');
    return response;
  } catch (error) {
    console.error('Error toggling image favorite status:', error);
    
    // Enhance error details for debugging
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    };
    
    console.error('Detailed toggle favorite error:', JSON.stringify(errorDetails, null, 2));
    
    throw error;
  }
};

/**
 * Get all favorite images
 * @returns {Promise} API response
 */
export const getFavoriteImages = async (options = {}, sort = 'date_desc', limit = 20) => {
  // Handle both object param and individual params
  let page = 1;
  let sortOption = sort;
  let limitOption = limit;
  
  // If options is an object, extract values
  if (typeof options === 'object') {
    page = options.page || 1;
    sortOption = options.sort || sort;
    limitOption = options.limit || limit;
  } else if (typeof options === 'number') {
    // If options is a number, treat it as page
    page = options;
  }
  
  try {
    console.log(`Fetching favorite images with page=${page}, sort=${sortOption}, limit=${limitOption}`);
    const response = await apiClient.get(
      `images/favorites?page=${page}&sort=${sortOption}&limit=${limitOption}`
    );
    
    console.log(`Favorite images fetched successfully: ${response.data.data?.length || 0} items`);
    return response;
  } catch (error) {
    console.error('Error fetching favorite images:', error);
    
    // Enhance error details for debugging
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    };
    
    console.error('Detailed error:', JSON.stringify(errorDetails, null, 2));
    
    throw error;
  }
};
/**
 * Get all trashed images
 * @returns {Promise} API response
 */
export const getTrashedImages = async () => {
  try {
    const response = await apiClient.get('images/trashed');
    
    // Process image paths in the response
    if (response.data && response.data.data) {
      response.data.data = response.data.data.map(image => ({
        ...image,
        _originalPath: image.path,
        path: getFullImagePath(image.path)
      }));
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching trashed images:', error);
    throw error;
  }
};

/**
 * Restore a trashed image
 * @param {number} imageId - Image ID
 * @returns {Promise} API response
 */
export const restoreImage = async (imageId) => {
  try {
    const response = await apiClient.post(`images/${imageId}/restore`);
    
    // Process image path in the response
    // Handle nested data structure
    if (response.data && response.data.data) {
      response.data.data._originalPath = response.data.data.path;
      response.data.data.path = getFullImagePath(response.data.data.path);
    }
    
    return response;
  } catch (error) {
    console.error('Error restoring image:', error);
    throw error;
  }
};

/**
 * Permanently delete an image
 * @param {number} imageId - Image ID
 * @returns {Promise} API response
 */
export const permanentlyDeleteImage = async (imageId) => {
  try {
    return await apiClient.delete(`images/${imageId}/force`);
  } catch (error) {
    console.error('Error permanently deleting image:', error);
    throw error;
  }
};