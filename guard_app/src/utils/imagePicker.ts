import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
}

export async function requestImagePickerPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to select a profile picture.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    Alert.alert('Error', 'Failed to request permissions. Please try again.');
    return false;
  }
}

export async function pickImageFromGallery(): Promise<ImagePickerResult | null> {
  try {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.8, // Compress image to 80% quality
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to select image. Please try again.');
    return null;
  }
}

export async function takePhotoWithCamera(): Promise<ImagePickerResult | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take a profile picture.',
        [{ text: 'OK' }],
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
      };
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
}

export function showImagePickerOptions({
  title,
  message,
}: {
  title: string;
  message: string;
}): Promise<ImagePickerResult | null> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await takePhotoWithCamera();
          resolve(result);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await pickImageFromGallery();
          resolve(result);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve(null),
      },
    ]);
  });
}
