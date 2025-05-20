import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Divider, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as profileApi from '../../services/api/profile';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    folderCount: 0,
    imageCount: 0,
    favoriteCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigation = useNavigation();

  // Fetch user profile and stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchUserStats();
    }, [])
  );

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const profileData = await profileApi.getProfile();
      if (profileData && (profileData.data || profileData)) {
        setUserProfile(profileData.data || profileData);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      setRefreshing(true);
      const response = await profileApi.getUserStats();
      
      // Handle different response structures
      if (response && response.data) {
        // Set all available stats, use defaults for missing ones
        setStats({
          folderCount: response.data.folderCount || 0,
          imageCount: response.data.imageCount || 0,
          favoriteCount: response.data.favoriteCount || 0,
        });
      } else {
        setStats(response || { folderCount: 0, imageCount: 0, favoriteCount: 0 });
      }
      
      console.log('User stats fetched successfully:', response?.data || response);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Continue with default stats if there's an error
      // Do not show error to user - just use default values
    } finally {
      setRefreshing(false);
    }
  };

  // Process and optimize image before upload
  const processImage = async (imageResult) => {
    try {
      setUploadingImage(true);
      
      let imageAsset = null;
      
      // Handle different response formats
      if (!imageResult.canceled && imageResult.assets && imageResult.assets.length > 0) {
        imageAsset = imageResult.assets[0];
      } else if (!imageResult.cancelled && imageResult.uri) {
        imageAsset = imageResult;
      } else {
        console.log('Image selection canceled');
        setUploadingImage(false);
        return null;
      }
      
      // Optimize image with ImageManipulator
      const manipResult = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return manipResult;
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
      setUploadingImage(false);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'We need access to your photos to set a profile picture');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const processedImage = await processImage(result);
        if (processedImage) {
          await uploadProfilePicture(processedImage);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
      setUploadingImage(false);
    }
  };
  
  // Take a photo with camera
  const takePhoto = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        const processedImage = await processImage(result);
        if (processedImage) {
          await uploadProfilePicture(processedImage);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      setUploadingImage(false);
    }
  };

  // Choose image source (camera or gallery)
  const chooseImageSource = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose a new profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage }
      ]
    );
  };

  const uploadProfilePicture = async (imageAsset) => {
    try {
      setLoading(true);
      
      // Create form data for image upload
      const formData = new FormData();
      
      // Add the image file
      formData.append('avatar', {
        uri: imageAsset.uri,
        name: 'profile-picture.jpg',
        type: 'image/jpeg',
      });

      // Upload the profile picture
      await profileApi.updateProfilePicture(formData);
      
      // Refresh user data to get updated avatar URL
      if (refreshUser) {
        await refreshUser();
      } else {
        await profileApi.refreshUserData();
      }
      
      // Also refresh the profile data to get the updated avatar
      await fetchUserProfile();
      
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleToggleTheme = async () => {
    try {
      // Toggle theme immediately for responsive feel
      toggleTheme();
      
      // Save preference to backend
      const newThemePreference = isDarkMode ? 'light' : 'dark';
      await profileApi.updateProfile({
        theme_preference: newThemePreference
      });
      
      console.log('Theme preference saved:', newThemePreference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Don't show alert for theme toggle errors
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };

  // Navigate to trash screen
  const goToTrash = () => {
    navigation.navigate('Trash');
  };

  // Show About dialog
  const showAboutInfo = () => {
    Alert.alert(
      'About StudySnap',
      'StudySnap App\nVersion 1.0.0\n\nYour all-in-one study companion for organizing and accessing your notes anytime, anywhere.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Get user name and email with proper fallbacks
  const getUserName = () => {
    // Try multiple potential locations for user name
    return user?.name || user?.profile?.name || 'User';
  };

  const getUserEmail = () => {
    // Try multiple potential locations for user email
    return user?.email || user?.profile?.email || '';
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    // Check multiple possible locations for the avatar
    return user?.profile?.avatar || userProfile?.avatar || null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Profile" color="#fff" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={chooseImageSource} disabled={loading || uploadingImage}>
            {uploadingImage ? (
              <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            ) : getAvatarUrl() ? (
              <Image 
                source={{ uri: getAvatarUrl() }} 
                style={styles.avatar}
                onError={(e) => {
                  console.error('Failed to load avatar image:', e.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="person" size={50} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{getUserName()}</Text>
          <Text style={styles.userEmail}>{getUserEmail()}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.folderCount || 0}</Text>
              <Text style={styles.statLabel}>Folders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.imageCount || 0}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
            {stats.favoriteCount !== undefined && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.favoriteCount}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={[styles.settingsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDarkMode ? "moon" : "moon-outline"} 
                size={22} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <Divider />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={goToTrash}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Trash</Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.disabled }]}>
                  View and manage deleted items
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update!')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Help & Support</Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.disabled }]}>
                  Get assistance with using the app
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={showAboutInfo}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={[styles.settingText, { color: theme.colors.text }]}>About</Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.disabled }]}>
                  App information and version
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
          icon="logout"
        >
          Log Out
        </Button>
        
        <Text style={styles.versionText}>
          StudySnap v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  settingsContainer: {
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 30,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  settingSubtext: {
    fontSize: 12,
    marginLeft: 15,
    marginTop: 2,
  },
  logoutButton: {
    margin: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 30,
  }
});

export default ProfileScreen;