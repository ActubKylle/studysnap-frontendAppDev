import apiClient from './client';

export const register = async (name, email, password, password_confirmation) => {
  try {
    const response = await apiClient.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.post('/logout');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Logout failed';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/user');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to get user data';
  }
};
