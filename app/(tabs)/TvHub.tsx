"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  StatusBar,
  Platform,
} from "react-native"
import { WebView } from "react-native-webview"
import { Feather } from "@expo/vector-icons"
import * as ScreenOrientation from "expo-screen-orientation"

// Define types
interface Channel {
  id: string
  name: string
  category: string
  embedUrl: string
  logo: string
}

// TV channel data
const tvChannels: Channel[] = [
  {
    id: "ntv-uganda",
    name: "NTV Uganda",
    category: "News",
    embedUrl: "https://stream.howto.co.ug/hls.html?rel=0&showinfo=0",
    logo: "https://via.placeholder.com/100x50",
  },
//   {
//     id: "galaxy-tv",
//     name: "Galaxy TV",
//     category: "News",
//     embedUrl: "https://player.castr.io/live_43351ad0f3b411ed81c78fcc31887c54?autoplay=1",
//     logo: "https://via.placeholder.com/100x50?text=Galaxy+TV",
// },
  {
    id: "bukedde",
    name: "Bukedde Tv Uganda",
    category: "News",
    embedUrl: "https://www.bukedde.co.ug/tv/4",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "dw-news",
    name: "DW News",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "citizen-tv",
    name: "Citizen TV Kenya",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UChBQgieUidXV1CmDxSdRm3g&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "al-jazeera",
    name: "Al Jazeera English",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "africanews",
    name: "Africanews English",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/NQjabLGdP5g",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "channels-tv",
    name: "Channels Television",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/W8nThq62Vb4",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "bbc-world",
    name: "BBC World News",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UC16niRr50-MSBwiO3YDb3RA&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "france24",
    name: "France 24 English",
    category: "News",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "sky-sports",
    name: "Sky Sports",
    category: "Sports",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCNAf1k0yIjyGu3k9BwAg3lg&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "espn",
    name: "ESPN",
    category: "Sports",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCiWLfSweyRNmLpgEHekhoAg&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "mtv",
    name: "MTV",
    category: "Entertainment",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UC6aRTOQrKGYFQcm-AlUGJVQ&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
  {
    id: "nat-geo",
    name: "National Geographic",
    category: "Documentary",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCpVm7bg6pXKo1Pr6k5kxG9A&autoplay=1",
    logo: "https://via.placeholder.com/100x50",
  },
]

// Available categories
const categories = ["All", "News", "Sports", "Entertainment", "Documentary"]

export default function TVScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [fullscreenChannel, setFullscreenChannel] = useState<Channel | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Handle animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  // Handle fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      // Lock to landscape orientation when fullscreen
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    } else {
      // Unlock orientation when exiting fullscreen
      ScreenOrientation.unlockAsync()
    }

    return () => {
      // Ensure orientation is unlocked when component unmounts
      ScreenOrientation.unlockAsync()
    }
  }, [isFullscreen])

  // Filter channels based on category and search query
  const filteredChannels = tvChannels.filter((channel) => {
    const matchesCategory = selectedCategory === "All" || channel.category === selectedCategory
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle entering fullscreen mode
  const handleOpenFullscreen = (channel: Channel) => {
    setFullscreenChannel(channel)
    setIsFullscreen(true)
  }

  // Handle exiting fullscreen mode
  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
    setFullscreenChannel(null)
  }

  // Category filter component
  const CategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )

  // TV Card component
  const LiveTvCard = ({ channel }: { channel: Channel }) => {
    const [isMuted, setIsMuted] = useState(true)
    const webViewRef = useRef<WebView>(null)

    const toggleMute = () => {
      setIsMuted(!isMuted)

      // Try to mute/unmute the WebView content
      if (webViewRef.current) {
        const script = isMuted
          ? 'document.querySelector("video").muted = false;'
          : 'document.querySelector("video").muted = true;'

        webViewRef.current.injectJavaScript(script)
      }
    }

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{channel.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{channel.category}</Text>
          </View>
        </View>

        <View style={styles.playerContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: `${channel.embedUrl}${channel.embedUrl.includes("?") ? "&" : "?"}mute=1` }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
          />

          {/* Controls overlay */}
          <View style={styles.controlsOverlay}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Feather name={isMuted ? "volume-x" : "volume-2"} size={16} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={() => handleOpenFullscreen(channel)}>
              <Feather name="maximize" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.fullscreenButton} onPress={() => handleOpenFullscreen(channel)}>
          <Text style={styles.fullscreenButtonText}>Watch Full Screen</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGradient} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.titleContainer}>
            <Feather name="tv" size={32} color="#FFD700" />
            <Text style={styles.title}>Kabs Broadcast</Text>
          </View>
          <Text style={styles.subtitle}>Watch your favorite channels live from around the world</Text>
        </Animated.View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <CategoryFilter />

        {/* TV Channels Grid */}
        <View style={styles.channelsGrid}>
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => <LiveTvCard key={channel.id} channel={channel} />)
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="globe" size={64} color="#FFD700" />
              <Text style={styles.emptyText}>No channels found. More channels coming soon...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Kabs Broadcast. All rights reserved.</Text>
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        onRequestClose={handleCloseFullscreen}
        animationType="fade"
        supportedOrientations={["landscape"]}
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar hidden />

          {fullscreenChannel && (
            <WebView
              source={{ uri: fullscreenChannel.embedUrl }}
              style={styles.fullscreenWebview}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={handleCloseFullscreen}>
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get("window")
const isTablet = width > 768
const numColumns = isTablet ? 2 : 1
const cardWidth = isTablet ? width / 2 - 24 : width - 32

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#8B0000",
    paddingTop:20

  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#8B0000",
    // Note: For a proper gradient, you would use react-native-linear-gradient
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: "italic",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "white",
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#FFD700",
  },
  categoryText: {
    color: "white",
    fontSize: 14,
  },
  selectedCategoryText: {
    color: "#8B0000",
    fontWeight: "bold",
  },
  channelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: cardWidth,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  playerContainer: {
    height: 180,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "black",
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenButton: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#FFD700",
    alignItems: "center",
  },
  fullscreenButtonText: {
    color: "#8B0000",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    color: "#FFD700",
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  fullscreenWebview: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
})

