import apiClient from './client';

export const getProfile = async () => {
  try {
    console.log('Fetching user profile');
    const response = await apiClient.get('profile');
    console.log('Profile fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error.response?.data?.message || 'Failed to fetch profile';
  }
};

export const updateProfile = async (profileData) => {
  try {
    console.log('Updating profile with data:', profileData);
    const response = await apiClient.put('profile', profileData);
    console.log('Profile updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error.response?.data || error);
    throw error.response?.data?.message || 'Failed to update profile';
  }
};

export const updateProfilePicture = async (imageFile) => {
  try {
    console.log('Uploading profile picture');
    
    // Create form data
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.fileName || 'profile.jpg'
    });
    
    console.log('Form data created for upload:', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.fileName || 'profile.jpg'
    });
    
    const response = await apiClient.post('profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Profile picture updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile picture:', error.response?.data || error);
    throw error.response?.data?.message || 'Failed to update profile picture';
  }
};

export const getUserStats = async () => {
  try {
    console.log('Fetching user stats');
    const response = await apiClient.get('/profile/stats');
    console.log('User stats fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    
    // Return default stats if there's an error
    return { 
      data: {
        folderCount: 0,
        imageCount: 0,
        favoriteCount: 0
      }
    };
  }
};

export const refreshUserData = async () => {
  try {
    console.log('Refreshing user data');
    const response = await apiClient.get('user');
    console.log('User data refreshed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    throw error.response?.data?.message || 'Failed to refresh user data';
  }
};