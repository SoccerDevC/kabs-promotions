import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const [timeOfDay, setTimeOfDay] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current; // Starts fully visible
  const slideAnim = useRef(new Animated.Value(0)).current; // No slide initially
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const router = useRouter();

  useEffect(() => {
    // Determine time of day
    const currentHour = new Date().getHours();
    let greeting = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
    setTimeOfDay(greeting);

    // Start intro animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Speak the welcome message after a short delay
    const speechTimer = setTimeout(() => {
      Speech.speak(`Welcome to Kabs Promotions. Enjoy your ${greeting} with us.`, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }, 500);

    // After 4 seconds, start fading out & sliding up
    const transitionTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0, // Fade out
          duration: 1000, // 1-second fade
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50, // Move up slightly
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        router.replace("/(tabs)/"); // Navigate after animation completes
      });
    }, 5300);

    return () => {
      clearTimeout(speechTimer);
      clearTimeout(transitionTimer);
      Speech.stop();
    };
  }, []);

  return (
    <LinearGradient
      colors={['#8B0000', '#800080', '#4B0082']}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandText}>Kabs Promotions</Text>
        
        <View style={styles.emojiContainer}>
          {/* Music emoji */}
          <Animated.Text 
            style={[
              styles.emoji,
              {
                transform: [
                  { 
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    }) 
                  }
                ]
              }
            ]}
          >
            🎵
          </Animated.Text>
          
          {/* Radio emoji */}
          <Animated.Text 
            style={[
              styles.emoji,
              {
                transform: [
                  { 
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    }) 
                  }
                ]
              }
            ]}
          >
            📻
          </Animated.Text>
          
          {/* TV emoji */}
          <Animated.Text 
            style={[
              styles.emoji,
              {
                transform: [
                  { 
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    }) 
                  }
                ]
              }
            ]}
          >
            📺
          </Animated.Text>
        </View>
        
        <Animated.Text 
          style={[
            styles.enjoyText,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1]
              })
            }
          ]}
        >
          Enjoy your {timeOfDay} with us
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    textAlign: 'center',
  },
  brandText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
    marginHorizontal: 15,
  },
  enjoyText: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 10,
  },
});

export default WelcomeScreen;
