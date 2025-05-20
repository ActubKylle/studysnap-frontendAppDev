// src/components/common/ImagePickerModal.js

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const ImagePickerModal = ({ visible, onClose, onCameraPress, onGalleryPress, theme }) => {
  const [slideAnim] = React.useState(new Animated.Value(height));
  
  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible, slideAnim]);
  
  const handleCloseRequest = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCloseRequest}
    >
      <TouchableWithoutFeedback onPress={handleCloseRequest}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContainer,
                { 
                  backgroundColor: theme?.colors?.card || '#fff',
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.handle} />
              
              <Text style={[styles.modalTitle, { color: theme?.colors?.text || '#000' }]}>
                Add Image
              </Text>
              
              <TouchableOpacity 
                style={styles.option}
                onPress={() => {
                  handleCloseRequest();
                  // Use setTimeout to ensure modal is closed before camera opens
                  setTimeout(() => {
                    onCameraPress();
                  }, 300);
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme?.colors?.primary + '20' || '#f0f0f0' }]}>
                  <Ionicons name="camera" size={24} color={theme?.colors?.primary || '#000'} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme?.colors?.text || '#000' }]}>
                    Camera
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme?.colors?.disabled || '#999' }]}>
                    Take a photo with your camera
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.option}
                onPress={() => {
                  handleCloseRequest();
                  // Use setTimeout to ensure modal is closed before gallery opens
                  setTimeout(() => {
                    onGalleryPress();
                  }, 300);
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme?.colors?.primary + '20' || '#f0f0f0' }]}>
                  <Ionicons name="images" size={24} color={theme?.colors?.primary || '#000'} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme?.colors?.text || '#000' }]}>
                    Gallery
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme?.colors?.disabled || '#999' }]}>
                    Choose an image from your gallery
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme?.colors?.background || '#f5f5f5' }]}
                onPress={handleCloseRequest}
              >
                <Text style={[styles.cancelText, { color: theme?.colors?.primary || '#000' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImagePickerModal;