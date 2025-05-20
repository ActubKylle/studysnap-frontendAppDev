import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
} from 'react-native';

// Import screens
import FoldersScreen from '../screens/folder/FolderScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen'; // Import the Favorites screen
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom animated tab bar
const AnimatedTabBar = ({ state, descriptors, navigation, theme }) => {
  const [translateX] = useState(new Animated.Value(0));
  const tabWidth = width / state.routes.length;
  
  // Function to animate the indicator
  const animateIndicator = (index) => {
    Animated.spring(translateX, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };
  
  // Animate on initial render to the current tab
  React.useEffect(() => {
    animateIndicator(state.index);
  }, [state.index]);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.card }]}>
      {/* Animated indicator bar */}
      <Animated.View 
        style={[
          styles.indicator, 
          { 
            width: tabWidth - 20,  // Slightly narrower than tab width
            backgroundColor: theme.colors.primary,
            transform: [{ translateX: Animated.add(translateX, 10) }], // Center the indicator
          }
        ]} 
      />
      
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        // Get the icon name for this tab
        let iconName;
        if (route.name === 'Folders') {
          iconName = isFocused ? 'folder' : 'folder-outline';
        } else if (route.name === 'Favorites') {
          iconName = isFocused ? 'star' : 'star-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
          
          // Animate the indicator
          animateIndicator(index);
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Animated.View style={[
              styles.tabIconContainer,
              isFocused && styles.tabIconContainerFocused
            ]}>
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? theme.colors.primary : theme.colors.text} 
              />
              <Animated.Text 
                style={[
                  styles.tabLabel,
                  { 
                    color: isFocused ? theme.colors.primary : theme.colors.text,
                    opacity: isFocused ? 1 : 0.7,
                    fontSize: isFocused ? 12 : 10,
                  }
                ]}
              >
                {route.name}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNavigator = () => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} theme={theme} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          borderTopWidth: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Folders" 
        component={FoldersScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'folder' : 'folder-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'star' : 'star-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 75,
    position: 'relative',
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  indicator: {
    height: 4,
    position: 'absolute',
    top: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 16,
    width: 60,
  },
  tabIconContainerFocused: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)', // Light yellow background for active tab
  },
  tabLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default TabNavigator;