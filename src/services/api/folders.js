// File: src/services/api/folders.js
// Fix import path to match your project structure
import apiClient from '../api/client';

/**
 * Get all folders
 * @param {object|number} options - Options object or page number
 * @param {string} sort - Sort order
 * @param {number} limit - Number of items per page
 * @returns {Promise} API response
 */
export const getFolders = async (options = {}, sort = 'date_desc', limit = 20) => {
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
    console.log(`Fetching folders with page=${page}, sort=${sortOption}, limit=${limitOption}`);
    const response = await apiClient.get(
      `folders?page=${page}&sort=${sortOption}&limit=${limitOption}`
    );
    
    console.log(`Folders fetched successfully: ${response.data.data?.length || 0} items`);
    return response;
  } catch (error) {
    console.error('Error fetching folders:', error);
    
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
 * Get all folders (alias for backward compatibility)
 */
export const getAllFolders = getFolders;

/**
 * Get a single folder by ID
 * @param {number} folderId - Folder ID
 * @returns {Promise} API response
 */
export const getFolder = async (folderId) => {
  try {
    console.log(`Fetching folder details for ID: ${folderId}`);
    
    const response = await apiClient.get(`folders/${folderId}`);
    
    // Log successful response
    console.log(`Folder details received:`, {
      id: response.data?.data?.id || response.data?.id,
      name: response.data?.data?.name || response.data?.name,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    return response;
  } catch (error) {
    console.error(`Error fetching folder details for ID ${folderId}:`, error);

    // Enhance error details for debugging
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    };
    
    console.error('Detailed folder fetch error:', JSON.stringify(errorDetails, null, 2));
    
    // Rethrow with more context
    const enhancedError = new Error(`Failed to fetch folder: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.details = errorDetails;
    throw enhancedError;
  }
};

/**
 * Create a new folder
 * @param {object} data - Folder data
 * @returns {Promise} API response
 */
export const createFolder = async (data) => {
  try {
    console.log('Creating new folder with data:', JSON.stringify(data));
    const response = await apiClient.post('folders', data);
    console.log('Folder created successfully, ID:', response.data?.id);
    return response;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Update an existing folder
 * @param {number} folderId - Folder ID
 * @param {object} data - Folder data to update
 * @returns {Promise} API response
 */
export const updateFolder = async (folderId, data) => {
  try {
    console.log(`Updating folder ${folderId} with data:`, JSON.stringify(data));
    const response = await apiClient.put(`folders/${folderId}`, data);
    console.log('Folder updated successfully');
    return response;
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

/**
 * Delete a folder (move to trash)
 * @param {number} folderId - Folder ID
 * @returns {Promise} API response
 */
export const deleteFolder = async (folderId) => {
  try {
    console.log(`Deleting folder ${folderId}`);
    return await apiClient.delete(`folders/${folderId}`);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Toggle favorite status
 * @param {number} folderId - Folder ID
 * @returns {Promise} API response
 */
export const toggleFavoriteFolder = async (folderId) => {
  try {
    console.log(`Toggling favorite status for folder ${folderId}`);
    
    // UPDATED: Based on the 404 error, your backend API expects a different endpoint
    // Try with the correct endpoint format instead (common RESTful patterns)
    const response = await apiClient.post(`folders/${folderId}/favorite`);
    
    // Alternative methods to try if the above doesn't work:
    // const response = await apiClient.put(`folders/${folderId}/favorite`);
    // const response = await apiClient.patch(`folders/${folderId}`, { is_favorite: true }); 
    
    console.log('Folder favorite status updated');
    return response;
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    
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
 * Get all favorite folders
 * @returns {Promise} API response
 */
export const getFavoriteFolders = async () => {
  try {
    console.log('Fetching favorite folders');
    const response = await apiClient.get('folders/favorites');
    console.log(`Favorite folders fetched: ${response.data.data?.length || 0} items`);
    return response;
  } catch (error) {
    console.error('Error fetching favorite folders:', error);
    throw error;
  }
};

/**
 * Get all trashed folders
 * @returns {Promise} API response
 */
export const getTrashedFolders = async () => {
  try {
    console.log('Fetching trashed folders');
    const response = await apiClient.get('folders/trashed');
    console.log(`Trashed folders fetched: ${response.data.data?.length || 0} items`);
    return response;
  } catch (error) {
    console.error('Error fetching trashed folders:', error);
    throw error;
  }
};

/**
 * Restore a trashed folder
 * @param {number} folderId - Folder ID
 * @returns {Promise} API response
 */
export const restoreFolder = async (folderId) => {
  try {
    console.log(`Restoring folder ${folderId} from trash`);
    const response = await apiClient.post(`folders/${folderId}/restore`);
    console.log('Folder restored successfully');
    return response;
  } catch (error) {
    console.error('Error restoring folder:', error);
    throw error;
  }
};

/**
 * Permanently delete a folder
 * @param {number} folderId - Folder ID
 * @returns {Promise} API response
 */
export const permanentlyDeleteFolder = async (folderId) => {
  try {
    console.log(`Permanently deleting folder ${folderId}`);
    return await apiClient.delete(`folders/${folderId}/force`);
  } catch (error) {
    console.error('Error permanently deleting folder:', error);
    throw error;
  }
};