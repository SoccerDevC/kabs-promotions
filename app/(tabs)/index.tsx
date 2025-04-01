"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import * as Database from "./services/database"

// Define interfaces for our data types
interface Update {
  id: string
  title: string
  description: string
  date: string
  icon: keyof typeof Ionicons.glyphMap
}

interface RadioStation {
  id: string
  name: string
  genre: string
  lastPlayed: string
  logo: string
}

interface TVChannel {
  id: string
  name: string
  lastWatched: string
  thumbnail: string
}

interface ChatRoom {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
}

interface Product {
  id: string
  name: string
  price: number
  image: string
}

interface VirtualFeature {
  id: string
  name: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  color: string
  description: string
}

const { width } = Dimensions.get("window")

const HomeScreen = () => {
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState("Guest")
  const [updates, setUpdates] = useState<Update[]>([])
  const [recentRadio, setRecentRadio] = useState<RadioStation[]>([])
  const [recentTV, setRecentTV] = useState<TVChannel[]>([])
  const [recentChats, setRecentChats] = useState<ChatRoom[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const scrollX = useRef(new Animated.Value(0)).current

  // Virtual event features
  const virtualFeatures: VirtualFeature[] = [
    {
      id: "1",
      name: "Virtual Events",
      icon: "calendar",
      route: "VirtualEventsHub",
      color: "#FF6B6B",
      description: "Browse upcoming and live events",
    },
    {
      id: "2",
      name: "Live Streams",
      icon: "videocam",
      route: "LiveStream",
      color: "#4ECDC4",
      description: "Watch live broadcasts",
    },
    {
      id: "3",
      name: "Breakout Rooms",
      icon: "people",
      route: "BreakoutRooms",
      color: "#FFD166",
      description: "Join topic-based discussions",
    },
    {
      id: "4",
      name: "Networking",
      icon: "chatbubbles",
      route: "NetworkingLounge",
      color: "#6A0572",
      description: "Connect with other attendees",
    },
    {
      id: "5",
      name: "Q&A Sessions",
      icon: "help-circle",
      route: "QASession",
      color: "#1A535C",
      description: "Ask questions to speakers",
    },
  ]

  // Initialize database and load data
  useEffect(() => {
    const initApp = async () => {
      await Database.initializeDatabase()
      loadData()
    }

    initApp()
  }, [])

  const loadData = async () => {
    try {
      // Load mock data for existing sections
      loadMockData()

      // Load live events from database
      const events = await Database.getEventsByStatus("live")
      setLiveEvents(events)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const loadMockData = () => {
    // Mock updates
    setUpdates([
      {
        id: "1",
        title: "New Radio Station Added",
        description: "Check out our new Jazz station with 24/7 smooth jazz.",
        date: "2 hours ago",
        icon: "radio",
      },
      {
        id: "2",
        title: "Weekend Live Event",
        description: "Join us this Saturday for a live streaming concert.",
        date: "1 day ago",
        icon: "calendar",
      },
      {
        id: "3",
        title: "App Update Available",
        description: "Version 2.1 is now available with improved performance.",
        date: "3 days ago",
        icon: "arrow-up-circle",
      },
    ])

    // Mock recent radio stations
    setRecentRadio([
      {
        id: "1",
        name: "Kabs FM",
        genre: "Variety",
        lastPlayed: "2 hours ago",
        logo: "https://img.icons8.com/color/96/000000/radio.png",
      },
    ])

    // Mock recent TV channels
    setRecentTV([
      {
        id: "1",
        name: "Kabs Entertainment",
        lastWatched: "5 hours ago",
        thumbnail: "https://img.icons8.com/color/96/000000/tv-show.png",
      },
      {
        id: "2",
        name: "Kabs News",
        lastWatched: "Yesterday",
        thumbnail: "https://img.icons8.com/color/96/000000/news.png",
      },
    ])

    // Mock recent chats
    setRecentChats([
      {
        id: "1",
        name: "General Chat",
        lastMessage: "Welcome to Kabs Live Chat!",
        time: "1 hour ago",
        unread: 2,
      },
      {
        id: "2",
        name: "Music Lovers",
        lastMessage: "Did anyone catch the live show yesterday?",
        time: "Yesterday",
        unread: 0,
      },
    ])

    // Mock featured products
    setFeaturedProducts([
      {
        id: "1",
        name: "Kabs T-Shirt",
        price: 24.99,
        image: "https://img.icons8.com/color/96/000000/t-shirt.png",
      },
      {
        id: "2",
        name: "Kabs Cap",
        price: 19.99,
        image: "https://img.icons8.com/color/96/000000/cap.png",
      },
      {
        id: "3",
        name: "Kabs Album",
        price: 12.99,
        image: "https://img.icons8.com/color/96/000000/cd.png",
      },
    ])
  }

  const onRefresh = () => {
    setRefreshing(true)
    // Refresh data
    loadData()
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }

  const openWebsite = () => {
    Linking.openURL("https://kabspromotions.com")
  }

  const navigateToScreen = (screenName: string, params = {}) => {
    // @ts-ignore - Navigation typing
    navigation.navigate(screenName, params)
  }

  const renderUpdateItem = ({ item }: { item: Update }) => (
    <TouchableOpacity style={styles.updateCard}>
      <View style={styles.updateIconContainer}>
        <Ionicons name={item.icon} size={24} color="#FFD700" />
      </View>
      <View style={styles.updateContent}>
        <Text style={styles.updateTitle}>{item.title}</Text>
        <Text style={styles.updateDescription}>{item.description}</Text>
        <Text style={styles.updateDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  )

  const renderRecentRadioItem = ({ item }: { item: RadioStation }) => (
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("Radio", { stationId: item.id })}>
      <Image source={{ uri: item.logo }} style={styles.recentItemImage} />
      <View style={styles.recentItemContent}>
        <Text style={styles.recentItemTitle}>{item.name}</Text>
        <Text style={styles.recentItemSubtitle}>{item.genre}</Text>
        <Text style={styles.recentItemTime}>{item.lastPlayed}</Text>
      </View>
      <Ionicons name="play-circle" size={24} color="#FFD700" />
    </TouchableOpacity>
  )

  const renderRecentTVItem = ({ item }: { item: TVChannel }) => (
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("TvHub", { channelId: item.id })}>
      <Image source={{ uri: item.thumbnail }} style={styles.recentItemImage} />
      <View style={styles.recentItemContent}>
        <Text style={styles.recentItemTitle}>{item.name}</Text>
        <Text style={styles.recentItemTime}>{item.lastWatched}</Text>
      </View>
      <Ionicons name="play-circle" size={24} color="#FFD700" />
    </TouchableOpacity>
  )

  const renderRecentChatItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("Chat", { roomId: item.id })}>
      <View style={styles.chatIconContainer}>
        <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.recentItemContent}>
        <Text style={styles.recentItemTitle}>{item.name}</Text>
        <Text style={styles.recentItemSubtitle} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.recentItemTime}>{item.time}</Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderFeaturedProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigateToScreen("Shop", { productId: item.id })}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  )

  const renderVirtualFeatureItem = ({ item, index }: { item: VirtualFeature; index: number }) => {
    const inputRange = [(index - 1) * width * 0.8, index * width * 0.8, (index + 1) * width * 0.8]

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    })

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    })

    return (
      <TouchableOpacity onPress={() => navigateToScreen(item.route)} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.featureCard,
            {
              backgroundColor: item.color,
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Ionicons name={item.icon} size={40} color="#FFFFFF" />
          <Text style={styles.featureTitle}>{item.name}</Text>
          <Text style={styles.featureDescription}>{item.description}</Text>

          <View style={styles.featureButton}>
            <Text style={styles.featureButtonText}>Open</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const renderLiveEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.liveEventCard} onPress={() => navigateToScreen("LiveStream", { eventId: item.id })}>
      <Image source={{ uri: item.imageUrl }} style={styles.liveEventImage} />
      <View style={styles.liveEventContent}>
        <View style={styles.liveEventHeader}>
          <Text style={styles.liveEventTitle}>{item.title}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.liveEventDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.liveEventFooter}>
          <View style={styles.liveEventAttendees}>
            <Ionicons name="people" size={16} color="#FFD700" />
            <Text style={styles.liveEventAttendeesText}>{item.attendees} attending</Text>
          </View>
          <View style={styles.liveEventJoinButton}>
            <Text style={styles.liveEventJoinText}>Join Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#8B0000", "#800080"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={["#FFD700"]} />
          }
        >
          {/* Welcome Header */}
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.websiteButton} onPress={openWebsite}>
              <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              <Text style={styles.websiteButtonText}>Website</Text>
            </TouchableOpacity>
          </View>

          {/* Virtual Event Features Carousel */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Virtual Event Features</Text>
            </View>

            <Animated.FlatList
              data={virtualFeatures}
              renderItem={renderVirtualFeatureItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuresContainer}
              snapToInterval={width * 0.8}
              decelerationRate="fast"
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            />
          </View>

          {/* Live Events Section */}
          {liveEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Now</Text>
                <TouchableOpacity onPress={() => navigateToScreen("VirtualEventsHub")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={liveEvents}
                renderItem={renderLiveEventItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* What's New Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What's New</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={updates}
              renderItem={renderUpdateItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              scrollEnabled={false}
            />
          </View>

          {/* Recently Played Radio */}
          {recentRadio.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Played Radio</Text>
                <TouchableOpacity onPress={() => navigateToScreen("Radio")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentRadio}
                renderItem={renderRecentRadioItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Recently Watched TV */}
          {recentTV.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Watched TV</Text>
                <TouchableOpacity onPress={() => navigateToScreen("TvHub")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentTV}
                renderItem={renderRecentTVItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Recent Chats */}
          {recentChats.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Chats</Text>
                <TouchableOpacity onPress={() => navigateToScreen("Chat")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentChats}
                renderItem={renderRecentChatItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <TouchableOpacity onPress={() => navigateToScreen("Shop")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={featuredProducts}
                renderItem={renderFeaturedProductItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 Kabs Promotions. All Rights Reserved.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  websiteButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
  },
  featuresSection: {
    marginBottom: 25,
  },
  featuresContainer: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  featureCard: {
    width: width * 0.8 - 30,
    height: 180,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  featureDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  featureButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  featureButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  seeAllText: {
    color: "#FFD700",
    fontSize: 14,
  },
  updateCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  updateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  updateDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 5,
  },
  updateDate: {
    fontSize: 12,
    color: "#FFD700",
  },
  recentItemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  recentItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  chatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  recentItemSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 2,
  },
  recentItemTime: {
    fontSize: 12,
    color: "#FFD700",
  },
  unreadBadge: {
    backgroundColor: "#FFD700",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#8B0000",
    fontSize: 12,
    fontWeight: "bold",
  },
  productsList: {
    paddingVertical: 10,
  },
  productCard: {
    width: 120,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginRight: 15,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "bold",
  },
  liveEventCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  liveEventImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  liveEventContent: {
    padding: 15,
  },
  liveEventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveEventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  liveEventDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
  },
  liveEventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveEventAttendees: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveEventAttendeesText: {
    fontSize: 12,
    color: "#FFD700",
    marginLeft: 4,
  },
  liveEventJoinButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveEventJoinText: {
    color: "#8B0000",
    fontWeight: "bold",
    fontSize: 12,
  },
  footer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.7,
  },
})

export default HomeScreen

