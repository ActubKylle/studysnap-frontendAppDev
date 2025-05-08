import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Appbar, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as profileApi from '../../services/api/profile';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    folderCount: 0,
    imageCount: 0,
  });

  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await profileApi.getUserStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const uploadProfilePicture = async (uri) => {
    setLoading(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      
      // Add the image file
      const filenameParts = uri.split('/');
      const filename = filenameParts[filenameParts.length - 1];
      
      formData.append('avatar', {
        uri,
        name: filename,
        type: 'image/jpeg',
      });

      // Upload the profile picture
      await profileApi.updateProfilePicture(formData);
      
      // Refresh user data
      await profileApi.refreshUserData();
      
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoading(false);
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
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Profile" color="#fff" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={loading}>
            {user?.profile?.avatar ? (
              <Image source={{ uri: user.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="person" size={50} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.folderCount}</Text>
              <Text style={styles.statLabel}>Folders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.imageCount}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
          </View>
        </View>

        <View style={[styles.settingsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <Divider />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Trash')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Trash</Text>
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
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('About', 'StudySnap App\nVersion 1.0.0\n\nYour all-in-one study companion for organizing and accessing your notes anytime, anywhere.')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
        >
          Log Out
        </Button>
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
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    marginTop: 10,
    marginBottom: 30,
  },
});

export default ProfileScreen;