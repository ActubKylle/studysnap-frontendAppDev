import apiClient from './client';

export const getTags = async () => {
  try {
    const response = await apiClient.get('/tags');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch tags';
  }
};

export const getTag = async (id) => {
  try {
    const response = await apiClient.get(`/tags/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch tag';
  }
};

export const createTag = async (tagData) => {
  try {
    const response = await apiClient.post('/tags', tagData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create tag';
  }
};

export const updateTag = async (id, tagData) => {
  try {
    const response = await apiClient.put(`/tags/${id}`, tagData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update tag';
  }
};

export const deleteTag = async (id) => {
  try {
    const response = await apiClient.delete(`/tags/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete tag';
  }
};

export const getFoldersWithTag = async (id) => {
  try {
    const response = await apiClient.get(`/tags/${id}/folders`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch folders with tag';
  }
};

export const getImagesWithTag = async (id) => {
  try {
    const response = await apiClient.get(`/tags/${id}/images`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch images with tag';
  }
};