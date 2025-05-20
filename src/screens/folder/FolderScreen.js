import React, { useState, useCallback, useContext, memo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Alert
} from 'react-native';
import { FAB, Searchbar, Menu, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

import FolderCard from '../../components/folder/Foldercard';
import * as folderApi from '../../services/api/folders';

const sortOptions = [
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Date (Newest)', value: 'date_desc' },
  { label: 'Date (Oldest)', value: 'date_asc' },
];

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Memoized FolderCard component to prevent unnecessary re-renders
const MemoizedFolderCard = memo(FolderCard);

// Extracted menu component to improve performance
const SortMenu = memo(({ visible, onDismiss, sortBy, handleSortChange, theme }) => (
  <Menu
    visible={visible}
    onDismiss={onDismiss}
    anchor={{ x: 0, y: 0 }}
    style={[styles.sortMenu, { backgroundColor: theme.colors.card }]}
  >
    {sortOptions.map((option) => (
      <Menu.Item
        key={option.value}
        title={option.label}
        onPress={() => handleSortChange(option.value)}
        titleStyle={{ color: sortBy === option.value ? theme.colors.primary : theme.colors.text }}
        leadingIcon={() => 
          sortBy === option.value ? 
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : 
            null
        }
      />
    ))}
  </Menu>
));

// Optimized dialog component to improve performance
const CreateFolderDialog = memo(({ 
  visible, 
  onDismiss, 
  newFolderName, 
  setNewFolderName, 
  newFolderColor, 
  setNewFolderColor, 
  handleCreateFolder, 
  error,
  theme,
  colorOptions 
}) => {
  // Use local state for input to prevent parent re-renders during typing
  const [localFolderName, setLocalFolderName] = useState(newFolderName);
  const [localError, setLocalError] = useState('');
  
  // Sync local state with parent state when dialog opens
  useEffect(() => {
    if (visible) {
      setLocalFolderName(newFolderName);
      setLocalError('');
    }
  }, [visible, newFolderName]);
  
  // Only update parent state when dialog is dismissed
  const handleDismiss = () => {
    setNewFolderName(localFolderName);
    onDismiss();
  };
  
  // Validate in the dialog before calling parent handler
  const handleCreate = () => {
    if (!localFolderName.trim()) {
      setLocalError('Please enter a folder name');
      return; // Don't proceed if validation fails
    }
    
    // Clear any previous errors
    setLocalError('');
    
    // Pass the local state directly to the create function
    handleCreateFolder(localFolderName, newFolderColor);
  };
  
  return (
    <Dialog
      visible={visible}
      onDismiss={handleDismiss}
      style={{ backgroundColor: theme.colors.card, borderRadius: 20 }}
    >
      <Dialog.Title style={{ color: theme.colors.text, textAlign: 'center' }}>Create New Folder</Dialog.Title>
      <Dialog.Content>
        {error || localError ? <Text style={styles.errorText}>{localError || error}</Text> : null}
        <TextInput
          label="Folder Name"
          value={localFolderName}
          onChangeText={(text) => {
            setLocalFolderName(text);
            if (text.trim()) setLocalError(''); // Clear error when user types
          }}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: theme.colors.primary } }}
          autoFocus={true}
          maxLength={50} // Limit length to improve performance
        />
        
        <Text style={[styles.colorLabel, { color: theme.colors.text }]}>Select Color</Text>
        <View style={styles.colorContainer}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                newFolderColor === color && styles.selectedColor,
              ]}
              onPress={() => setNewFolderColor(color)}
            />
          ))}
        </View>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleDismiss} textColor={theme.colors.text}>
          Cancel
        </Button>
        <Button 
          onPress={handleCreate} 
          textColor={theme.colors.primary} 
          mode="contained" 
          buttonColor={theme.colors.primary + '20'}
          disabled={!localFolderName.trim()}
        >
          Create
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.error === nextProps.error &&
    prevProps.newFolderColor === nextProps.newFolderColor
  );
});

// Empty state component
const EmptyState = memo(({ search, theme }) => (
  <View style={styles.emptyContainer}>
    <Animated.View 
      style={styles.emptyIconContainer}
    >
      <Ionicons name="folder-open-outline" size={80} color={theme.colors.primary} />
    </Animated.View>
    <Text style={[styles.emptyText, { color: theme.colors.text }]}>
      No folders found
    </Text>
    <Text style={[styles.emptySubText, { color: theme.colors.disabled }]}>
      {search ? 'Try a different search term' : 'Create your first folder to get started'}
    </Text>
  </View>
));

const FoldersScreen = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#FFC107');
  const [error, setError] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  const colorOptions = [
    '#FFC107', // Yellow (default)
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#F44336', // Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
  ];

  const fetchFolders = useCallback(async () => {
    setError('');
    try {
      console.log('Fetching folders with sort:', sortBy);
      // Changed to call the API correctly with the sort parameter
      const response = await folderApi.getFolders({ sort: sortBy });
      
      // Handle different response structures
      let foldersList = [];
      if (response.data && response.data.data) {
        // Handle paginated response
        foldersList = response.data.data;
        console.log(`Found ${foldersList.length} folders in data.data`);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle direct array response
        foldersList = response.data;
        console.log(`Found ${foldersList.length} folders in data array`);
      } else {
        console.warn('Unexpected API response structure:', response.data);
        // Try to extract folders from the response in other ways
        if (response.data) {
          console.log('Response data keys:', Object.keys(response.data));
        }
      }
      
      // Ensure each folder has an id to avoid toString() error
      foldersList = foldersList.map((folder, index) => {
        if (!folder.id) {
          console.warn('Folder without ID found, assigning temporary ID:', folder);
          return { ...folder, id: `temp-${index}` };
        }
        return folder;
      });
      
      setFolders(foldersList);
      setFilteredFolders(foldersList);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useFocusEffect(
    useCallback(() => {
      fetchFolders();
    }, [fetchFolders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFolders();
  }, [fetchFolders]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim() === '') {
        setFilteredFolders(folders);
      } else {
        const filtered = folders.filter(folder =>
          folder.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredFolders(filtered);
      }
    }, 300),
    [folders]
  );
  
  const handleSearch = useCallback((query) => {
    setSearch(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleSortChange = useCallback((option) => {
    setSortBy(option);
    setSortMenuVisible(false);
  }, []);

  // Optimized folder creation function - UPDATED
  const handleCreateFolder = async (folderName, folderColor) => {
    // Use the passed parameters if available, otherwise fall back to state
    const name = folderName || newFolderName;
    const color = folderColor || newFolderColor;
    
    if (!name || !name.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setIsCreatingFolder(true);
    
    try {
      // Close dialog immediately for better UX
      setCreateDialogVisible(false);
      
      // Show loading indicator
      setLoading(true);
      
      const folderData = {
        name: name.trim(),
        color: color
      };
      
      const response = await folderApi.createFolder(folderData);
      
      // Extract folder properly from the response
      let newFolder = null;
      
      // Handle nested data structure - FIXED
      if (response.data && response.data.data) {
        newFolder = response.data.data;
        console.log('Extracted folder from response.data.data:', newFolder);
      } else if (response.data) {
        newFolder = response.data;
        console.log('Extracted folder from response.data:', newFolder);
      }
      
      // Make sure the folder has an ID - IMPORTANT CHECK
      if (newFolder) {
        console.log('New folder extracted:', newFolder);
        
        if (!newFolder.id && newFolder.data && newFolder.data.id) {
          // Handle double-nested data
          newFolder = newFolder.data;
          console.log('Found ID in nested data:', newFolder.id);
        }
        
        if (!newFolder.id) {
          console.error('Created folder without ID', newFolder);
          Alert.alert('Warning', 'Folder created but has an invalid ID. Please refresh.');
          fetchFolders(); // Refresh the folders to get the proper data
          return;
        }
        
        // Update state with the new folder
        console.log('Adding new folder to state with ID:', newFolder.id);
        setFolders(prevFolders => [newFolder, ...prevFolders]);
        setFilteredFolders(prevFiltered => [newFolder, ...prevFiltered]);
        
        // Reset folder creation form
        setNewFolderName('');
        setNewFolderColor('#FFC107');
        setError('');
      } else {
        console.error('Failed to extract new folder data from response:', response);
        Alert.alert('Warning', 'Folder may have been created but could not be displayed. Please refresh.');
        fetchFolders();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      // Reopen dialog to show the error
      setCreateDialogVisible(true);
    } finally {
      setLoading(false);
      setIsCreatingFolder(false);
    }
  };

  // Handle opening the create dialog
  const handleOpenCreateDialog = useCallback(() => {
    setNewFolderName('');
    setNewFolderColor('#FFC107');
    setError('');
    setCreateDialogVisible(true);
  }, []);

  const handleFolderPress = useCallback((folder) => {
    console.log('Folder press:', folder);
    
    // Safety check for folder ID
    if (!folder || !folder.id) {
      console.error('Attempted to navigate to folder without valid ID:', folder);
      Alert.alert('Error', 'Cannot open this folder. It has an invalid ID.');
      return;
    }
    
    // Make sure to use the exact screen name as registered in your navigator
    console.log('Navigating to folder detail with ID:', folder.id);
    navigation.navigate('FolderDetail', { folderId: folder.id });
  }, [navigation]);

  // Handle folder actions from long press
  const handleFolderAction = useCallback(async (action, folderId, data) => {
    console.log(`Performing action ${action} on folder ${folderId}`);
    
    switch (action) {
      case 'delete':
        try {
          setLoading(true);
          await folderApi.deleteFolder(folderId);
          
          // Update local state by filtering out the deleted folder
          setFolders(prevFolders => prevFolders.filter(folder => folder.id !== folderId));
          setFilteredFolders(prevFiltered => prevFiltered.filter(folder => folder.id !== folderId));
          
          Alert.alert('Success', 'Folder moved to trash');
        } catch (error) {
          console.error('Error deleting folder:', error);
          Alert.alert('Error', 'Failed to delete folder. Please try again.');
        } finally {
          setLoading(false);
        }
        break;
        
      case 'edit':
        try {
          if (!data || !data.name) {
            Alert.alert('Error', 'Invalid folder data provided');
            return;
          }
          
          setLoading(true);
          const response = await folderApi.updateFolder(folderId, data);
          
          // Extract updated folder data from response
          let updatedFolder = null;
          if (response.data && response.data.data) {
            updatedFolder = response.data.data;
          } else if (response.data) {
            updatedFolder = response.data;
          }
          
          if (updatedFolder) {
            // Update folder in state
            setFolders(prevFolders => 
              prevFolders.map(folder => 
                folder.id === folderId ? { ...folder, ...updatedFolder } : folder
              )
            );
            
            setFilteredFolders(prevFiltered => 
              prevFiltered.map(folder => 
                folder.id === folderId ? { ...folder, ...updatedFolder } : folder
              )
            );
            
            Alert.alert('Success', 'Folder updated successfully');
          } else {
            // If we couldn't extract the updated folder data, refetch all folders
            await fetchFolders();
          }
        } catch (error) {
          console.error('Error updating folder:', error);
          Alert.alert('Error', 'Failed to update folder. Please try again.');
        } finally {
          setLoading(false);
        }
        break;
        
      case 'toggleFavorite':
        try {
          setLoading(true);
          const response = await folderApi.toggleFavoriteFolder(folderId);
          
          // Extract updated folder data from response
          let updatedFolder = null;
          if (response.data && response.data.data) {
            updatedFolder = response.data.data;
          } else if (response.data) {
            updatedFolder = response.data;
          }
          
          if (updatedFolder) {
            // Update folder in state
            setFolders(prevFolders => 
              prevFolders.map(folder => 
                folder.id === folderId ? { 
                  ...folder, 
                  is_favorite: updatedFolder.is_favorite ?? !folder.is_favorite 
                } : folder
              )
            );
            
            setFilteredFolders(prevFiltered => 
              prevFiltered.map(folder => 
                folder.id === folderId ? { 
                  ...folder, 
                  is_favorite: updatedFolder.is_favorite ?? !folder.is_favorite 
                } : folder
              )
            );
          } else {
            // If we couldn't extract the updated folder data, toggle locally
            setFolders(prevFolders => 
              prevFolders.map(folder => 
                folder.id === folderId ? { ...folder, is_favorite: !folder.is_favorite } : folder
              )
            );
            
            setFilteredFolders(prevFiltered => 
              prevFiltered.map(folder => 
                folder.id === folderId ? { ...folder, is_favorite: !folder.is_favorite } : folder
              )
            );
          }
        } catch (error) {
          console.error('Error toggling favorite status:', error);
          Alert.alert('Error', 'Failed to update favorite status. Please try again.');
        } finally {
          setLoading(false);
        }
        break;
        
      default:
        console.warn(`Unknown folder action: ${action}`);
    }
  }, [fetchFolders]);

  const renderItem = useCallback(({ item }) => {
    // Additional safety check for the item
    if (!item) {
      console.warn('Undefined item passed to renderItem');
      return null;
    }
    
    return (
      <MemoizedFolderCard 
        folder={item} 
        onPress={handleFolderPress} 
        onFolderAction={handleFolderAction} // Pass the folder action handler
      />
    );
  }, [handleFolderPress, handleFolderAction]);

  const keyExtractor = useCallback(item => {
    // Safety check to prevent toString errors
    if (!item || !item.id) {
      console.warn('Item without ID passed to keyExtractor:', item);
      return `fallback-${Math.random().toString(36).substring(2, 9)}`;
    }
    return item.id.toString();
  }, []);

  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        { 
          backgroundColor: theme.colors.background,
          // Handle status bar height on Android
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }
      ]}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Folders</Text>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search folders"
              onChangeText={handleSearch}
              value={search}
              style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
              iconColor={theme.colors.primary}
              inputStyle={{ color: theme.colors.text }}
            />
            <TouchableOpacity 
              style={[styles.sortButton, { backgroundColor: theme.colors.card }]} 
              onPress={() => setSortMenuVisible(true)}
            >
              <Ionicons name="funnel-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <SortMenu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          sortBy={sortBy}
          handleSortChange={handleSortChange}
          theme={theme}
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filteredFolders.length === 0 ? (
          <EmptyState search={search} theme={theme} />
        ) : (
          <FlatList
            data={filteredFolders}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            numColumns={2}
            maxToRenderPerBatch={10}  
            windowSize={5}            
            removeClippedSubviews={true} 
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

        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={handleOpenCreateDialog}
          color="#fff"
          disabled={isCreatingFolder}
        />

        <Portal>
          <CreateFolderDialog
            visible={createDialogVisible}
            onDismiss={() => setCreateDialogVisible(false)}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            newFolderColor={newFolderColor}
            setNewFolderColor={setNewFolderColor}
            handleCreateFolder={handleCreateFolder}
            error={error}
            theme={theme}
            colorOptions={colorOptions}
          />
        </Portal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    elevation: 2,
    borderRadius: 12,
    height: 46,
  },
  sortButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  sortMenu: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 200,
    elevation: 4,
    borderRadius: 12,
  },
  list: {
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  input: {
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#000',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorContainer: {
    margin: 10,
    padding: 12,
    backgroundColor: '#ffeeee',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorMessage: {
    color: '#cc0000',
    textAlign: 'center',
  },
});

export default FoldersScreen;