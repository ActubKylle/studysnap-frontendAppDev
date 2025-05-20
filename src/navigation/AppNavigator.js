import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import FolderDetailScreen from '../screens/folder/FolderDetailScreen';
import CameraScreen from '../screens/image/CameraScreen';
import TrashScreen from '../screens/trash/TrashScreen';
import ImageDetailScreen from '../screens/image/ImageDetailScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const RootStack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="ImageDetail" component={ImageDetailScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Trash" component={TrashScreen} />

    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);
  const [isFirstLaunch, setIsFirstLaunch] = React.useState(null);

  React.useEffect(() => {
    async function checkIfFirstLaunch() {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking if first launch:', error);
        setIsFirstLaunch(false);
      }
    }
    
    checkIfFirstLaunch();
  }, []);

  if (loading || isFirstLaunch === null) {
    // Return loading screen
    return null;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && !user ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : user ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;