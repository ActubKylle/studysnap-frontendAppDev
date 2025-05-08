import apiClient from './client';

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch profile';
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update profile';
  }
};

export const updateProfilePicture = async (formData) => {
  try {
    const response = await apiClient.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update profile picture';
  }
};

export const getUserStats = async () => {
  try {
    const response = await apiClient.get('/profile/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user stats';
  }
};

export const refreshUserData = async () => {
  try {
    const response = await apiClient.get('/user');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to refresh user data';
  }
};