"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

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

const HomeScreen = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState("Guest")
  const [updates, setUpdates] = useState<Update[]>([])
  const [recentRadio, setRecentRadio] = useState<RadioStation[]>([])
  const [recentTV, setRecentTV] = useState<TVChannel[]>([])
  const [recentChats, setRecentChats] = useState<ChatRoom[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  // Load mock data on component mount
  useEffect(() => {
    loadMockData()
  }, [])

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
      {
        id: "2",
        name: "Kabs Hits",
        genre: "Pop",
        lastPlayed: "Yesterday",
        logo: "https://img.icons8.com/color/96/000000/musical-notes.png",
      },
      {
        id: "3",
        name: "Kabs Jazz",
        genre: "Jazz",
        lastPlayed: "3 days ago",
        logo: "https://img.icons8.com/color/96/000000/saxophone.png",
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
    // Simulate a refresh
    setTimeout(() => {
      loadMockData()
      setRefreshing(false)
    }, 1500)
  }

  const openWebsite = () => {
    Linking.openURL("https://kabspromotions.com")
  }

  // ✅ Fixed routing issue
  const navigateToScreen = (screenName: string, params = {}) => {
    // Map the screen name to a valid route path
    let pathname: any

    switch (screenName) {
      case "radio":
        pathname = "/(tabs)/Radio"
        break
      case "tvhub":
        pathname = "/(tabs)/TvHub"
        break
      case "chat":
        pathname = "/(tabs)/Chat"
        break
      case "shop":
        pathname = "/(tabs)/Shop"
        break
      default:
        pathname = "/(tabs)"
    }

    // Navigate to the selected screen
    router.push({
      pathname,
      params,
    })
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
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("radio", { stationId: item.id })}>
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
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("tvhub", { channelId: item.id })}>
      <Image source={{ uri: item.thumbnail }} style={styles.recentItemImage} />
      <View style={styles.recentItemContent}>
        <Text style={styles.recentItemTitle}>{item.name}</Text>
        <Text style={styles.recentItemTime}>{item.lastWatched}</Text>
      </View>
      <Ionicons name="play-circle" size={24} color="#FFD700" />
    </TouchableOpacity>
  )

  const renderRecentChatItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity style={styles.recentItemCard} onPress={() => navigateToScreen("chat", { roomId: item.id })}>
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
    <TouchableOpacity style={styles.productCard} onPress={() => navigateToScreen("shop", { productId: item.id })}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
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
                <TouchableOpacity onPress={() => navigateToScreen("radio")}>
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
                <TouchableOpacity onPress={() => navigateToScreen("tvhub")}>
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
                <TouchableOpacity onPress={() => navigateToScreen("chat")}>
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
                <TouchableOpacity onPress={() => navigateToScreen("shop")}>
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

