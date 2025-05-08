// File: src/screens/favorites/FavoritesScreen.js
import React, { useState, useCallback, useContext, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

import FolderCard from '../../components/folder/Foldercard';
import * as folderApi from '../../services/api/folders';

// Simplified FavoritesScreen that only shows favorite folders
// since the /images/favorites endpoint is not available in your API
const FavoritesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [error, setError] = useState(null);
  
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  // Fetch favorite folders
  const fetchFavorites = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      
      // Fetch favorite folders
      const foldersResponse = await folderApi.getFavoriteFolders();
      let folders = [];
      
      if (foldersResponse?.data?.data) {
        folders = foldersResponse.data.data;
      } else if (Array.isArray(foldersResponse?.data)) {
        folders = foldersResponse.data;
      }
      
      console.log(`Fetched ${folders.length} favorite folders`);
      setFavoriteFolders(folders);
      
      // Apply search filter if needed
      if (search) {
        const filtered = folders.filter(folder => 
          folder.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredFolders(filtered);
      } else {
        setFilteredFolders(folders);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorite folders. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);
  
  // Handle search changes
  const handleSearch = useCallback((text) => {
    setSearch(text);
    if (text) {
      const filtered = favoriteFolders.filter(folder => 
        folder.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredFolders(filtered);
    } else {
      setFilteredFolders(favoriteFolders);
    }
  }, [favoriteFolders]);
  
  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );
  
  // Handle manual refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);
  
  // Navigate to folder detail screen
  const handleFolderPress = useCallback((folder) => {
    navigation.navigate('FolderDetail', { folderId: folder.id });
  }, [navigation]);

  // Render folder item
  const renderItem = useCallback(({ item }) => {
    return <FolderCard folder={item} onPress={() => handleFolderPress(item)} />;
  }, [handleFolderPress]);
  
  // Key extractor for FlatList
  const keyExtractor = useCallback((item) => {
    return `folder-${item.id || Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Empty state component
  const renderEmptyList = useCallback(() => {
    const emptyMessage = search
      ? 'No matching favorite folders found'
      : 'No favorite folders yet';
    
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
          <Ionicons 
            name="star-outline"
            size={80} 
            color={theme.colors.primary} 
          />
        </View>
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          {emptyMessage}
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.disabled }]}>
          {search 
            ? 'Try a different search term' 
            : 'Mark folders as favorites for quick access'}
        </Text>
        <TouchableOpacity
          style={[styles.browseButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Folders')}
        >
          <Ionicons name="folder-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.browseButtonText}>Browse Folders</Text>
        </TouchableOpacity>
      </View>
    );
  }, [search, theme, navigation]);

  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }
      ]}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorite Folders</Text>
          
          {/* Search bar */}
          <Searchbar
            placeholder="Search favorites"
            onChangeText={handleSearch}
            value={search}
            style={[styles.searchBar, { backgroundColor: theme.colors.card }]}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.text }}
          />
        </View>
        
        {/* Error state */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}
        
        {/* Loading state */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          /* Content list */
          <FlatList
            data={filteredFolders}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={renderEmptyList}
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
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    height: 46,
  },
  listContent: {
    padding: 10,
    paddingBottom: 80,
    minHeight: '100%',
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
    marginTop: 50,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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

export default FavoritesScreen;