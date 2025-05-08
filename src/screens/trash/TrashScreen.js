// File: src/screens/trash/TrashScreen.js
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
} from 'react-native';
import { Appbar, Button, Chip, Menu, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

// Import placeholder components - replace these with your actual components when available
const FolderCard = ({ folder, onPress, disabled }) => (
  <View style={styles.cardPlaceholder}>
    <Text>{folder?.name || 'Folder'}</Text>
  </View>
);

const ImageCard = ({ image, onPress, disabled }) => (
  <View style={styles.cardPlaceholder}>
    <Text>{image?.name || 'Image'}</Text>
  </View>
);

// Mock API functions - replace these with your actual API functions
const getTrashedFolders = async () => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: [
        { id: 1, name: 'Deleted Folder 1', created_at: new Date().toISOString() },
        { id: 2, name: 'Deleted Folder 2', created_at: new Date().toISOString() }
      ]});
    }, 500);
  });
};

const getTrashedImages = async () => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: [
        { id: 1, name: 'Deleted Image 1', created_at: new Date().toISOString() },
        { id: 2, name: 'Deleted Image 2', created_at: new Date().toISOString() }
      ]});
    }, 500);
  });
};

const restoreFolder = async (id) => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Folder restored successfully' });
    }, 500);
  });
};

const forceDeleteFolder = async (id) => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Folder deleted permanently' });
    }, 500);
  });
};

const restoreImage = async (id) => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Image restored successfully' });
    }, 500);
  });
};

const forceDeleteImage = async (id) => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Image deleted permanently' });
    }, 500);
  });
};

const emptyTrash = async () => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Trash emptied successfully' });
    }, 500);
  });
};

const TrashScreen = () => {
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [trashedImages, setTrashedImages] = useState([]);
  const [activeTab, setActiveTab] = useState('folders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Use a default theme if ThemeContext is not available yet
  const defaultTheme = {
    colors: {
      background: '#F5F5F5',
      primary: '#FFC107',
      card: '#FFFFFF',
      text: '#212121',
      error: '#F44336',
      disabled: '#BDBDBD',
    }
  };
  
  const contextTheme = useContext(ThemeContext);
  const { theme = defaultTheme } = contextTheme || {};
  
  const navigation = useNavigation();

  const fetchTrashedItems = async () => {
    setLoading(true);
    try {
      const foldersResponse = await getTrashedFolders();
      setTrashedFolders(foldersResponse.data);

      const imagesResponse = await getTrashedImages();
      setTrashedImages(imagesResponse.data);
    } catch (err) {
      console.error('Error fetching trashed items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrashedItems();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrashedItems();
  };

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
              await emptyTrash();
              fetchTrashedItems();
            } catch (err) {
              console.error('Error emptying trash:', err);
              Alert.alert('Error', 'Failed to empty trash');
            }
          },
        },
      ]
    );
  };

  const handleRestoreFolder = async (folderId) => {
    try {
      await restoreFolder(folderId);
      setTrashedFolders(trashedFolders.filter(folder => folder.id !== folderId));
    } catch (err) {
      console.error('Error restoring folder:', err);
      Alert.alert('Error', 'Failed to restore folder');
    }
  };

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
              await forceDeleteFolder(folderId);
              setTrashedFolders(trashedFolders.filter(folder => folder.id !== folderId));
            } catch (err) {
              console.error('Error deleting folder:', err);
              Alert.alert('Error', 'Failed to delete folder');
            }
          },
        },
      ]
    );
  };

  const handleRestoreImage = async (imageId) => {
    try {
      await restoreImage(imageId);
      setTrashedImages(trashedImages.filter(image => image.id !== imageId));
    } catch (err) {
      console.error('Error restoring image:', err);
      Alert.alert('Error', 'Failed to restore image');
    }
  };

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
              await forceDeleteImage(imageId);
              setTrashedImages(trashedImages.filter(image => image.id !== imageId));
            } catch (err) {
              console.error('Error deleting image:', err);
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const renderFolderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <FolderCard folder={item} disabled />
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleRestoreFolder(item.id)}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteFolder(item.id)}
        >
          <Ionicons name="trash" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImageItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <ImageCard image={item} disabled />
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleRestoreImage(item.id)}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteImage(item.id)}
        >
          <Ionicons name="trash" size={18} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
              activeTab === 'folders' && { color: theme.colors.primary },
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'folders' ? (
        trashedFolders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color={theme.colors.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No folders in trash
            </Text>
          </View>
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
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color={theme.colors.disabled} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No images in trash
          </Text>
        </View>
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
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 15,
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
  itemContainer: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
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
  },
  emptyTrashButton: {
    marginBottom: 10,
  },
  emptyTrashNote: {
    textAlign: 'center',
    fontSize: 12,
  },
  cardPlaceholder: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TrashScreen;