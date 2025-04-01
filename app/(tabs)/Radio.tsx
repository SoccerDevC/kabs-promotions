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
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native"
import { Audio } from "expo-av"
import { LinearGradient } from "expo-linear-gradient"
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

const { width, height } = Dimensions.get("window")

// Define radio station type with location data
interface RadioStation {
  id: string
  name: string
  streamUrl: string
  imageUrl: string
  location: {
    city: string
    latitude: number
    longitude: number
    description: string
  }
  frequency: string
  genre: string
  language: string
}

// Radio stations data with location information
const radioStations: RadioStation[] = [
  {
    id: "station1",
    name: "CBS EMANDUSO",
    streamUrl: "https://s5.voscast.com:9905/EMMANDUSO",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3136,
      longitude: 32.5811,
      description: "Broadcasting from the heart of Kampala",
    },
    frequency: "88.8 FM",
    genre: "News & Entertainment",
    language: "Luganda",
  },
  {
    id: "station2",
    name: "Sanyu Fm",
    streamUrl: "http://s44.myradiostream.com:8138/;",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3157,
      longitude: 32.5985,
      description: "Uganda's first private radio station",
    },
    frequency: "88.2 FM",
    genre: "Music & Entertainment",
    language: "English",
  },
  {
    id: "station4",
    name: "Galaxy Fm",
    streamUrl: "https://stream.radio.co/s1ef6287cc/listen",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3176,
      longitude: 32.5822,
      description: "Uganda's leading urban youth station",
    },
    frequency: "100.2 FM",
    genre: "Urban Music",
    language: "English & Luganda",
  },
  {
    id: "station5",
    name: "Papa Fm",
    streamUrl: "https://stream-175.zeno.fm/uv626z88af9uv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3145,
      longitude: 32.5732,
      description: "Community radio for local news",
    },
    frequency: "104.1 FM",
    genre: "Community Radio",
    language: "Luganda",
  },
  {
    id: "station6",
    name: "Radio One",
    streamUrl: "https://radioone.loftuganda.tech/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3198,
      longitude: 32.5854,
      description: "Uganda's premier talk radio",
    },
    frequency: "90.0 FM",
    genre: "Talk Radio",
    language: "English",
  },
  {
    id: "station7",
    name: "Akaboozi Fm",
    streamUrl: "http://162.244.80.52:8732/stream.mp3",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3167,
      longitude: 32.5833,
      description: "Voice of the people",
    },
    frequency: "87.9 FM",
    genre: "News & Talk",
    language: "Luganda",
  },
  {
    id: "station8",
    name: "X Fm",
    streamUrl: "https://stream.hydeinnovations.com:2020/stream/xfm/stream/1/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3145,
      longitude: 32.5901,
      description: "Alternative music and lifestyle",
    },
    frequency: "94.8 FM",
    genre: "Alternative Rock",
    language: "English",
  },
  {
    id: "station9",
    name: "Capital Fm Ug",
    streamUrl: "https://capitalfm.cloudrad.io/stream/1/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3152,
      longitude: 32.5863,
      description: "Uganda's best music mix",
    },
    frequency: "91.3 FM",
    genre: "Pop & Contemporary",
    language: "English",
  },
  {
    id: "station15",
    name: "KFM",
    streamUrl: "http://radio.kfm.co.ug:8000/stream",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Kampala",
      latitude: 0.3149,
      longitude: 32.5844,
      description: "News and entertainment",
    },
    frequency: "93.3 FM",
    genre: "News & Entertainment",
    language: "English",
  },
  {
    id: "station16",
    name: "Vision Radio Mbarara",
    streamUrl: "https://stream.zeno.fm/rmtdek37zxhvv",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Mbarara",
      latitude: -0.6167,
      longitude: 30.65,
      description: "Voice of Western Uganda",
    },
    frequency: "89.7 FM",
    genre: "Regional News",
    language: "Runyankole & English",
  },
  {
    id: "station17",
    name: "Radio Maria Mbarara",
    streamUrl: "https://dreamsiteradiocp5.com/proxy/ugandakamp?mp=/stream/",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/1251/1251671.png",
    location: {
      city: "Mbarara",
      latitude: -0.6145,
      longitude: 30.6578,
      description: "Catholic radio station",
    },
    frequency: "90.4 FM",
    genre: "Religious",
    language: "Runyankole & English",
  },
]

// Define view modes
type ViewMode = "list" | "grid" | "map"

export default function RadioMapScreen() {
  // State for currently playing audio
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [errorStations, setErrorStations] = useState<Set<string>>(new Set())

  // State for view mode and selected station
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 0.3476,
    longitude: 32.5825,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const colorShift = useRef(new Animated.Value(0)).current
  const mapSlideAnim = useRef(new Animated.Value(height)).current
  const mapRef = useRef<MapView>(null)

  // Set up audio mode for background playback
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Configure audio to play in background
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
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
      duration: 1000,
      useNativeDriver: true,
    }).start()

    // Color shift animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorShift, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(colorShift, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ]),
    ).start()

    // Request location permissions
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is needed to show your position on the map.")
        return
      }
    })()

    // Clean up sound on unmount
    return () => {
      cleanupSound()
    }
  }, [])

  // Update map when selected station changes
  useEffect(() => {
    if (selectedStation) {
      const { latitude, longitude } = selectedStation.location
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }

      setMapRegion(newRegion)

      // Animate map to show
      Animated.spring(mapSlideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start()

      // Animate map to new region
      mapRef.current?.animateToRegion(newRegion, 1000)
    } else {
      // Hide map when no station is selected
      Animated.spring(mapSlideAnim, {
        toValue: height,
        friction: 8,
        useNativeDriver: true,
      }).start()
    }
  }, [selectedStation])

  // Safe cleanup function for sound
  const cleanupSound = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync()
        if (status.isLoaded) {
          await sound.stopAsync()
          await sound.unloadAsync()
        }
      } catch (error) {
        console.error("Error cleaning up sound:", error)
      } finally {
        setSound(null)
        setCurrentlyPlaying(null)
        setSelectedStation(null)
      }
    }
  }

  // Interpolate color for animation
  const titleColor = colorShift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#FFD700", "#FF6347", "#FFD700"],
  })

  // Handle play/pause toggle
  const togglePlay = async (station: RadioStation) => {
    try {
      const stationId = station.id

      // If this station is already playing, pause it
      if (currentlyPlaying === stationId) {
        await cleanupSound()
        setSelectedStation(null)
        return
      }

      // Set loading state
      setIsLoading(stationId)

      // Clean up any existing sound
      await cleanupSound()

      // Create new sound but don't play automatically
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.streamUrl },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            cleanupSound()
          }
        },
      )

      // Now explicitly play the sound
      await newSound.playAsync()

      setSound(newSound)
      setCurrentlyPlaying(stationId)
      setSelectedStation(station)

      // Remove this station from error list if it was there
      if (errorStations.has(stationId)) {
        const newErrorStations = new Set(errorStations)
        newErrorStations.delete(stationId)
        setErrorStations(newErrorStations)
      }
    } catch (error) {
      console.error("Error playing audio:", error)

      // Add this station to error list
      setErrorStations(new Set(errorStations).add(station.id))

      // Show error message to user
      Alert.alert("Playback Error", `Unable to play ${station.name}. The station may be unavailable.`, [{ text: "OK" }])
    } finally {
      setIsLoading(null)
    }
  }

  // Radio station card component for grid view
  const RadioStationCard = ({ station }: { station: RadioStation }) => {
    const isPlaying = currentlyPlaying === station.id
    const isStationLoading = isLoading === station.id
    const hasError = errorStations.has(station.id)

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
      <Animated.View
        style={[
          styles.stationCard,
          { transform: [{ scale: cardScale }] },
          hasError && styles.errorCard,
          isPlaying && styles.playingCard,
        ]}
      >
        <View style={styles.stationIconContainer}>
          <Image source={{ uri: station.imageUrl }} style={styles.stationIcon} />
          <Text style={styles.stationFrequency}>{station.frequency}</Text>
        </View>

        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationLocation}>{station.location.city}</Text>
          <Text style={styles.stationGenre}>{station.genre}</Text>
        </View>

        <TouchableOpacity
          style={[styles.playButton, hasError && styles.errorButton, isPlaying && styles.playingButton]}
          onPress={() => togglePlay(station)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isStationLoading}
        >
          {isStationLoading ? (
            <ActivityIndicator color="#8B0000" size="small" />
          ) : (
            <Ionicons name={hasError ? "refresh" : isPlaying ? "pause" : "play"} size={24} color="#8B0000" />
          )}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Radio station list item component for list view
  const RadioStationListItem = ({ station }: { station: RadioStation }) => {
    const isPlaying = currentlyPlaying === station.id
    const isStationLoading = isLoading === station.id
    const hasError = errorStations.has(station.id)

    return (
      <TouchableOpacity
        style={[styles.stationListItem, isPlaying && styles.playingListItem, hasError && styles.errorListItem]}
        onPress={() => togglePlay(station)}
        disabled={isStationLoading}
      >
        <Image source={{ uri: station.imageUrl }} style={styles.listItemIcon} />

        <View style={styles.listItemInfo}>
          <Text style={styles.listItemName}>{station.name}</Text>
          <Text style={styles.listItemDetails}>
            {station.frequency} • {station.location.city}
          </Text>
          <Text style={styles.listItemGenre}>{station.genre}</Text>
        </View>

        <View style={styles.listItemControls}>
          {isStationLoading ? (
            <ActivityIndicator color="#FFD700" size="small" />
          ) : (
            <Ionicons
              name={hasError ? "refresh" : isPlaying ? "pause-circle" : "play-circle"}
              size={36}
              color="#FFD700"
            />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  // View mode toggle buttons
  const ViewModeToggle = () => (
    <View style={styles.viewModeToggle}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === "grid" && styles.activeViewMode]}
        onPress={() => setViewMode("grid")}
      >
        <Ionicons name="grid" size={24} color={viewMode === "grid" ? "#FFD700" : "#FFFFFF"} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === "list" && styles.activeViewMode]}
        onPress={() => setViewMode("list")}
      >
        <Ionicons name="list" size={24} color={viewMode === "list" ? "#FFD700" : "#FFFFFF"} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === "map" && styles.activeViewMode]}
        onPress={() => setViewMode("map")}
      >
        <Ionicons name="map" size={24} color={viewMode === "map" ? "#FFD700" : "#FFFFFF"} />
      </TouchableOpacity>
    </View>
  )

  // Now Playing overlay
  const NowPlayingOverlay = () => {
    if (!selectedStation) return null

    return (
      <View style={styles.nowPlayingContainer}>
        <View style={styles.nowPlayingContent}>
          <Image source={{ uri: selectedStation.imageUrl }} style={styles.nowPlayingImage} />

          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingTitle}>Now Playing</Text>
            <Text style={styles.nowPlayingStation}>{selectedStation.name}</Text>
            <Text style={styles.nowPlayingDetails}>
              {selectedStation.frequency} • {selectedStation.location.city}
            </Text>
          </View>

          <TouchableOpacity style={styles.stopButton} onPress={() => cleanupSound()}>
            <Ionicons name="stop-circle" size={40} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <Text style={styles.nowPlayingDescription}>{selectedStation.location.description}</Text>
      </View>
    )
  }

  // Render map view
  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} region={mapRegion} mapType="satellite">
        {radioStations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.location.latitude,
              longitude: station.location.longitude,
            }}
            title={station.name}
            description={station.frequency}
            pinColor={currentlyPlaying === station.id ? "#FFD700" : "#FF5252"}
            onPress={() => togglePlay(station)}
          >
            <View style={[styles.customMarker, currentlyPlaying === station.id && styles.activeMarker]}>
              <Ionicons name="radio" size={18} color={currentlyPlaying === station.id ? "#8B0000" : "#FFFFFF"} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.mapOverlay}>
        <Text style={styles.mapTitle}>Radio Stations Map</Text>
        <Text style={styles.mapSubtitle}>Tap on a marker to play</Text>
      </View>

      <TouchableOpacity style={styles.backToListButton} onPress={() => setViewMode("grid")}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        <Text style={styles.backToListText}>Back to Stations</Text>
      </TouchableOpacity>
    </View>
  )

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

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Animated.Text style={[styles.title, { color: titleColor }]}>Kabs Radio Uganda</Animated.Text>
        <Text style={styles.subtitle}>Connect to Local Communities</Text>

        <ViewModeToggle />
      </Animated.View>

      {/* Main content based on view mode */}
      {viewMode === "map" ? (
        renderMapView()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {viewMode === "grid" ? (
            <View style={styles.stationsGrid}>
              {radioStations.map((station) => (
                <RadioStationCard key={station.id} station={station} />
              ))}
            </View>
          ) : (
            <View style={styles.stationsList}>
              {radioStations.map((station) => (
                <RadioStationListItem key={station.id} station={station} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Map overlay that slides up when a station is playing */}
      <Animated.View style={[styles.mapOverlayContainer, { transform: [{ translateY: mapSlideAnim }] }]}>
        <View style={styles.mapOverlayHeader}>
          <Text style={styles.mapOverlayTitle}>Station Location</Text>
          <TouchableOpacity style={styles.closeMapButton} onPress={() => setSelectedStation(null)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <MapView
          style={styles.stationMap}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          mapType="satellite"
          zoomEnabled={true}
          zoomControlEnabled={true}
        >
          {selectedStation && (
            <Marker
              coordinate={{
                latitude: selectedStation.location.latitude,
                longitude: selectedStation.location.longitude,
              }}
              title={selectedStation.name}
              description={selectedStation.frequency}
            >
              <View style={styles.pulsingMarker}>
                <View style={styles.markerInner}>
                  <Ionicons name="radio" size={20} color="#8B0000" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      </Animated.View>

      {/* Now playing overlay */}
      {selectedStation && <NowPlayingOverlay />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#8B0000",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop:10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    padding: 4,
  },
  viewModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activeViewMode: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 12,
  },
  stationsList: {
    padding: 12,
  },
  stationCard: {
    width: (width - 36) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  playingCard: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  errorCard: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  stationIconContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  stationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFD700",
    marginBottom: 8,
  },
  stationFrequency: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  stationInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  stationLocation: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  stationGenre: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
  playButton: {
    backgroundColor: "#FFD700",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  playingButton: {
    backgroundColor: "#FFFFFF",
  },
  errorButton: {
    backgroundColor: "#FF9999",
  },
  stationListItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  playingListItem: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
  },
  errorListItem: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  listItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  listItemDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  listItemGenre: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
  listItemControls: {
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  mapTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  mapSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  backToListButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    backgroundColor: "rgba(139, 0, 0, 0.8)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  backToListText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
  customMarker: {
    backgroundColor: "#FF5252",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  activeMarker: {
    backgroundColor: "#FFD700",
    borderColor: "#8B0000",
  },
  mapOverlayContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.5,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mapOverlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mapOverlayTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeMapButton: {
    padding: 4,
  },
  stationMap: {
    flex: 1,
  },
  pulsingMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  markerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  nowPlayingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#FFD700",
  },
  nowPlayingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  nowPlayingImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  nowPlayingStation: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  nowPlayingDetails: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  nowPlayingDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  stopButton: {
    padding: 4,
  },
})

