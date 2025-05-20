import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Appbar, Button, Menu } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import * as folderApi from '../../services/api/folders';
import * as imageApi from '../../services/api/images';

// Trashed Folder Card Component
const TrashedFolderCard = ({ folder, onRestore, onDelete }) => {
  const { theme } = useContext(ThemeContext);
  
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
  
  return (
    <View style={[styles.folderCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.folderContent}>
        <View style={[styles.folderIcon, { backgroundColor: folder.color || theme.colors.primary }]}>
          <Ionicons name="folder" size={36} color="#FFF" />
        </View>
        <View style={styles.folderInfo}>
          <Text style={[styles.folderName, { color: theme.colors.text }]} numberOfLines={1}>
            {folder.name}
          </Text>
          <Text style={[styles.folderDate, { color: theme.colors.disabled }]}>
            Deleted: {formatDate(folder.deleted_at)}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onRestore(folder.id)}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => onDelete(folder.id)}
        >
          <Ionicons name="trash" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Trashed Image Card Component
const TrashedImageCard = ({ image, onRestore, onDelete }) => {
  const { theme } = useContext(ThemeContext);
  
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
  
  return (
    <View style={[styles.imageCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: image.path }} 
          style={styles.imagePreview}
          defaultSource={require('../../assets/images/place-holder.jpg')}
        />
      </View>
      
      <View style={styles.imageInfo}>
        <Text style={[styles.imageName, { color: theme.colors.text }]} numberOfLines={1}>
          {image.name}
        </Text>
        <Text style={[styles.imageDate, { color: theme.colors.disabled }]}>
          Deleted: {formatDate(image.deleted_at)}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onRestore(image.id)}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => onDelete(image.id)}
        >
          <Ionicons name="trash" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TrashScreen = () => {
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [trashedImages, setTrashedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('folders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [error, setError] = useState(null);

  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  // Function to fetch trashed items
  const fetchTrashedItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get trashed folders from API
      const foldersResponse = await folderApi.getTrashedFolders();
      
      // Handle different response structures
      let foldersList = [];
      if (foldersResponse.data && foldersResponse.data.data) {
        foldersList = foldersResponse.data.data;
      } else if (foldersResponse.data) {
        foldersList = foldersResponse.data;
      }
      
      console.log(`Found ${foldersList.length} trashed folders`);
      setTrashedFolders(foldersList);

      // Get trashed images from API
      const imagesResponse = await imageApi.getTrashedImages();
      
      // Handle different response structures
      let imagesList = [];
      if (imagesResponse.data && imagesResponse.data.data) {
        imagesList = imagesResponse.data.data;
      } else if (imagesResponse.data) {
        imagesList = imagesResponse.data;
      }
      
      console.log(`Found ${imagesList.length} trashed images`);
      setTrashedImages(imagesList);
    } catch (err) {
      console.error('Error fetching trashed items:', err);
      
      // Handle 404 errors gracefully (empty trash case)
      if (err.response && err.response.status === 404) {
        // Just set empty arrays, this likely means there are no items in trash
        console.log('No items in trash (404 response)');
        setTrashedFolders([]);
        setTrashedImages([]);
      } else {
        // For other errors, show error state
        setError('Failed to load trashed items. Pull down to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTrashedItems();
    }, [])
  );

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTrashedItems();
  };

  // Empty all items from trash
  const handleEmptyTrash = () => {
    Alert.alert(
      'Empty Trash',
      'Are you sure you want to permanently delete all items in the trash? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Empty trash via API
              await folderApi.emptyTrash();
              
              // Clear local state
              setTrashedFolders([]);
              setTrashedImages([]);
              
              Alert.alert('Success', 'Trash emptied successfully');
            } catch (err) {
              console.error('Error emptying trash:', err);
              Alert.alert('Error', 'Failed to empty trash. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Restore folder from trash
  const handleRestoreFolder = async (folderId) => {
    try {
      setLoading(true);
      
      // Call API to restore folder
      await folderApi.restoreFolder(folderId);
      
      // Update local state
      setTrashedFolders(trashedFolders.filter(folder => folder.id !== folderId));
      
      Alert.alert('Success', 'Folder restored successfully');
    } catch (err) {
      console.error('Error restoring folder:', err);
      Alert.alert('Error', 'Failed to restore folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete folder
  const handleDeleteFolder = async (folderId) => {
    Alert.alert(
      'Delete Permanently',
      'Are you sure you want to permanently delete this folder? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call API to permanently delete folder
              await folderApi.permanentlyDeleteFolder(folderId);
              
              // Update local state
              setTrashedFolders(trashedFolders.filter(folder => folder.id !== folderId));
              
              Alert.alert('Success', 'Folder permanently deleted');
            } catch (err) {
              console.error('Error deleting folder:', err);
              Alert.alert('Error', 'Failed to delete folder. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Restore image from trash
  const handleRestoreImage = async (imageId) => {
    try {
      setLoading(true);
      
      // Call API to restore image
      await imageApi.restoreImage(imageId);
      
      // Update local state
      setTrashedImages(trashedImages.filter(image => image.id !== imageId));
      
      Alert.alert('Success', 'Image restored successfully');
    } catch (err) {
      console.error('Error restoring image:', err);
      Alert.alert('Error', 'Failed to restore image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete image
  const handleDeleteImage = async (imageId) => {
    Alert.alert(
      'Delete Permanently',
      'Are you sure you want to permanently delete this image? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call API to permanently delete image
              await imageApi.forceDeleteImage(imageId);
              
              // Update local state
              setTrashedImages(trashedImages.filter(image => image.id !== imageId));
              
              Alert.alert('Success', 'Image permanently deleted');
            } catch (err) {
              console.error('Error deleting image:', err);
              Alert.alert('Error', 'Failed to delete image. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render folder list item
  const renderFolderItem = ({ item }) => (
    <TrashedFolderCard
      folder={item}
      onRestore={handleRestoreFolder}
      onDelete={handleDeleteFolder}
    />
  );

  // Render image list item
  const renderImageItem = ({ item }) => (
    <TrashedImageCard
      image={item}
      onRestore={handleRestoreImage}
      onDelete={handleDeleteImage}
    />
  );

  // Render empty state with icon and text
  const renderEmptyState = (type) => {
    const isFolder = type === 'folders';
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={isFolder ? "folder-open-outline" : "images-outline"} 
          size={80} 
          color={theme.colors.disabled} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          No {isFolder ? 'folders' : 'images'} in trash
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.disabled }]}>
          Deleted {isFolder ? 'folders' : 'images'} will appear here
        </Text>
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={80} color={theme.colors.error} />
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          {error || 'Something went wrong'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={fetchTrashedItems}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Trash" color="#fff" />
        <Appbar.Action icon="dots-vertical" color="#fff" onPress={() => setMenuVisible(true)} />
      </Appbar.Header>

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={[styles.menu, { backgroundColor: theme.colors.card }]}
      >
        <Menu.Item
          icon="delete-sweep"
          title="Empty Trash"
          onPress={() => {
            setMenuVisible(false);
            handleEmptyTrash();
          }}
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'folders' && [
              styles.activeTab,
              { borderColor: theme.colors.primary }
            ],
          ]}
          onPress={() => setActiveTab('folders')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'folders' ? theme.colors.primary : theme.colors.text },
            ]}
          >
            Folders ({trashedFolders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'images' && [
              styles.activeTab,
              { borderColor: theme.colors.primary }
            ],
          ]}
          onPress={() => setActiveTab('images')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'images' ? theme.colors.primary : theme.colors.text },
            ]}
          >
            Images ({trashedImages.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading items...
          </Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : activeTab === 'folders' ? (
        trashedFolders.length === 0 ? (
          renderEmptyState('folders')
        ) : (
          <FlatList
            data={trashedFolders}
            renderItem={renderFolderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )
      ) : trashedImages.length === 0 ? (
        renderEmptyState('images')
      ) : (
        <FlatList
          data={trashedImages}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {(activeTab === 'folders' && trashedFolders.length > 0) ||
      (activeTab === 'images' && trashedImages.length > 0) ? (
        <View style={styles.emptyTrashContainer}>
          <Button
            mode="outlined"
            icon="delete-sweep"
            onPress={handleEmptyTrash}
            style={[styles.emptyTrashButton, { borderColor: theme.colors.error }]}
            textColor={theme.colors.error}
          >
            Empty Trash
          </Button>
          <Text style={[styles.emptyTrashNote, { color: theme.colors.disabled }]}>
            Items in trash will be automatically deleted after 30 days
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// Basic styles needed for the component to work
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 200,
    elevation: 4,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '80%',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  folderCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  folderDate: {
    fontSize: 12,
    marginTop: 4,
  },
  imageCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  imageWrapper: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageInfo: {
    marginBottom: 12,
  },
  imageName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageDate: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  emptyTrashContainer: {
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emptyTrashButton: {
    marginBottom: 10,
  },
  emptyTrashNote: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default TrashScreen;