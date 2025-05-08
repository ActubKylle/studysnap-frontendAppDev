// File: src/screens/onboarding/OnboardingScreen.js
import React, { useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { ThemeContext } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { theme } = useContext(ThemeContext);

  const onboardingData = [
    {
      id: '1',
      title: 'Welcome to StudySnap',
      description: 'Your all-in-one study companion for organizing and accessing your notes anytime, anywhere.',
      image: require('../../assets/images/Logo.png'),
    },
    {
      id: '2',
      title: 'Create Folders',
      description: 'Organize your study materials into folders for different subjects or courses.',
      image: require('../../assets/images/Logo.png'),
    },
    {
      id: '3',
      title: 'Capture & Store',
      description: 'Snap photos of your notes, textbooks, or whiteboards and access them whenever you need.',
      image: require('../../assets/images/Logo.png'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    handleDone();
  };

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('alreadyLaunched', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slide, { backgroundColor: theme.colors.background }]}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.colors.text }]}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.colors.text }]}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentIndex ? theme.colors.primary : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleNext}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        labelStyle={styles.buttonText}
      >
        {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;