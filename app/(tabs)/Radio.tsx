"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  Easing,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { Audio } from "expo-av"
import { LinearGradient } from "expo-linear-gradient"

// Define radio station type
interface RadioStation {
  id: string
  name: string
  streamUrl: string
  imageUrl: string
}

// Radio stations data
const radioStations: RadioStation[] = [
  {
    id: "station1",
    name: "CBS EMANDUSO",
    streamUrl: "https://s5.voscast.com:9905/EMMANDUSO",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station2",
    name: "Sanyu Fm",
    streamUrl: "http://s44.myradiostream.com:8138/;",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station3",
    name: "Radio City",
    streamUrl: "https://cast1.my-control-panel.com/proxy/richar16/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station4",
    name: "Galaxy Fm",
    streamUrl: "https://stream.radio.co/s1ef6287cc/listen",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station5",
    name: "Papa Fm",
    streamUrl: "https://stream-175.zeno.fm/uv626z88af9uv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station6",
    name: "Radio One",
    streamUrl: "https://radioone.loftuganda.tech/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station7",
    name: "Akaboozi Fm",
    streamUrl: "http://162.244.80.52:8732/stream.mp3",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station8",
    name: "X Fm",
    streamUrl: "https://stream.hydeinnovations.com:2020/stream/xfm/stream/1/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station9",
    name: "Capital Fm Ug",
    streamUrl: "https://capitalfm.cloudrad.io/stream/1/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station10",
    name: "Smooth Radio",
    streamUrl: "https://media-ice.musicradio.com/SmoothUK",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station11",
    name: "Capital FM",
    streamUrl: "https://media-ice.musicradio.com/CapitalUK",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station12",
    name: "Bilal FM",
    streamUrl: "https://stream-172.zeno.fm/5e9fdntae77tv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station13",
    name: "Voice Of Africa Kigali",
    streamUrl: "https://stream.zeno.fm/xaddmq0bilntv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station14",
    name: "Pearl Radio FM",
    streamUrl: "https://dc4.serverse.com/proxy/pearlfm/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station15",
    name: "KFM",
    streamUrl: "http://radio.kfm.co.ug:8000/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station16",
    name: "Vision Radio Mbarara",
    streamUrl: "https://stream.zeno.fm/rmtdek37zxhvv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
  {
    id: "station17",
    name: "Radio Maria Mbarara",
    streamUrl: "https://dreamsiteradiocp5.com/proxy/ugandakamp?mp=/stream/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
  },
]

export default function RadioScreen() {
  // State for currently playing audio
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const colorShift = useRef(new Animated.Value(0)).current

  // Set up audio mode for background playback
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Configure audio to play in background
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // This is the correct place for this property
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })
      } catch (error) {
        console.error("Failed to set audio mode:", error)
      }
    }

    setupAudio()
  }, [])

  // Set up animations on component mount
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start()

    // Color shift animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorShift, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(colorShift, {
          toValue: 0,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
    ).start()

    // Clean up sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  // Interpolate color for animation
  const titleColor = colorShift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#FFD700", "#FF6347", "#FFD700"],
  })

  // Handle play/pause toggle
  const togglePlay = async (stationId: string, streamUrl: string) => {
    try {
      // If this station is already playing, pause it
      if (currentlyPlaying === stationId) {
        if (sound) {
          await sound.pauseAsync()
          setCurrentlyPlaying(null)
        }
        return
      }

      // Set loading state
      setIsLoading(stationId)

      // If another station is playing, stop it
      if (sound) {
        await sound.unloadAsync()
      }

      // Create and play new sound - removed staysActiveInBackground from here
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: streamUrl }, { shouldPlay: true })

      setSound(newSound)
      setCurrentlyPlaying(stationId)
      setIsLoading(null)
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsLoading(null)

      // Show error alert or toast here if needed
    }
  }

  // Radio station card component
  const RadioStationCard = ({ station }: { station: RadioStation }) => {
    const isPlaying = currentlyPlaying === station.id
    const isStationLoading = isLoading === station.id

    // Card animation
    const cardScale = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.95,
        friction: 8,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start()
    }

    return (
      <Animated.View style={[styles.stationCard, { transform: [{ scale: cardScale }] }]}>
        <Image source={{ uri: station.imageUrl }} style={styles.stationIcon} />
        <Text style={styles.stationName}>{station.name}</Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => togglePlay(station.id, station.streamUrl)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isStationLoading}
        >
          {isStationLoading ? (
            <ActivityIndicator color="#8B0000" size="small" />
          ) : (
            <Text style={styles.playButtonText}>{isPlaying ? "Pause" : "Play"}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      {/* Animated background gradient */}
      <LinearGradient
        colors={["#8B0000", "#800080", "#4B0082"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.title, { color: titleColor }]}>Online Radio Hub</Animated.Text>
          <Text style={styles.subtitle}>Your Gateway to Global Music</Text>
        </Animated.View>

        {/* Radio stations grid */}
        <View style={styles.stationsGrid}>
          {radioStations.map((station) => (
            <RadioStationCard key={station.id} station={station} />
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Kabs Online Radio Hub. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  )
}
const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // Two cards per row with padding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:20,
    backgroundColor: "#8B0000",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: "italic",
  },
  stationsGrid: {
    flexDirection: "row", // Arrange cards in rows
    flexWrap: "wrap",     // Wrap cards to the next row
    justifyContent: "space-between", // Add space between cards
    paddingHorizontal: 16, // Add horizontal padding for spacing
    marginBottom: 20,
  },
  stationCard: {
    width: cardWidth, // Use the calculated width for two cards per row
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16, // Add vertical spacing between rows
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFD700",
    padding: 10,
    marginBottom: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
    textAlign: "center",
  },
  playButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  playButtonText: {
    color: "#8B0000",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontSize: 14,
  },
});