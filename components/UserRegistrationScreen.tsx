import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../app/utils/supabase';
import { decode } from '../app/utils/helpers';
import { User } from '../types/chat';

export default function UserRegistrationScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate a random color for the user
  const generateRandomColor = () => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
      '#33A8FF', '#A833FF', '#FFD700', '#00CED1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
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
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!profileImage) {
      Alert.alert('Error', 'Please select a profile image');
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim());

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'Username already exists. Please choose another one.');
        setLoading(false);
        return;
      }

      // Get image info and prepare for upload
      const imageUri = profileImage;
      const fileExt = imageUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64data = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64File = base64data.split(',')[1];

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, decode(base64File), {
            contentType: `image/${fileExt}`,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        // Create user object
        const newUser: User = {
          username: username.trim(),
          profilePic: imageUrl,
          color: generateRandomColor(),
        };

        // Save user to Supabase
        const { error: userError } = await supabase
          .from('users')
          .insert([
            { 
              username: newUser.username,
              profile_pic: newUser.profilePic,
              color: newUser.color
            }
          ]);

        if (userError) throw userError;

        // Save user to AsyncStorage
        await AsyncStorage.setItem('chatUser', JSON.stringify(newUser));

        // Navigate to chat screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat', params: { currentUser: newUser } }],
        });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Failed to register. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#8B0000', '#800080']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Join the Chat</Text>
            <Text style={styles.subtitle}>
              Enter your name and upload a profile picture to get started
            </Text>

            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.uploadText}>Upload Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Join Chat</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  imageUpload: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
