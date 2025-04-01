"use client"

// Import the URL polyfill at the top of your file
import "react-native-url-polyfill/auto"
import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import { Audio } from "expo-av"
import { supabase, decode, checkSupabaseConnection, ensureUserExists, type Message } from "../utils/supabase"
import NetInfo from "@react-native-community/netinfo"

// Define types for our data
interface ChatMessage extends Message {}

interface ChatRoom {
  id: string
  name: string
  active: boolean
}

interface User {
  username: string
  profilePic: string | null
  color: string
  isGuest: boolean
  email?: string
}

const ChatScreen = () => {
  const params = useLocalSearchParams()
  const { roomId } = params

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auth related states
  const [showAuthModal, setShowAuthModal] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register" | "guest">("guest") // Default to guest for easier testing
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  // Add a state to track connection status
  const [isConnected, setIsConnected] = useState(true)

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    { id: "1", name: "General Chat", active: true },
    { id: "2", name: "Music Lovers", active: false },
    { id: "3", name: "Events & Promotions", active: false },
    { id: "4", name: "Gaming", active: false },
  ])

  const flatListRef = useRef<FlatList | null>(null)

  // Function to load messages
  const loadMessages = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      // Check internet connectivity first
      const netInfo = await NetInfo.fetch()
      if (!netInfo.isConnected) {
        throw new Error("No internet connection")
      }

      // Check connection first
      const connected = await checkSupabaseConnection()
      setIsConnected(connected)

      if (!connected) {
        throw new Error("Unable to connect to the chat server")
      }

      // Fetch messages from Supabase with proper typing
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<Message[]>()

      if (error) throw error

      // Reverse to show oldest first
      setMessages(data ? data.reverse() : [])
    } catch (error: any) {
      console.error("Error loading messages:", error)

      // Use a more user-friendly error message
      let errorMessage = "Failed to load messages"

      if (error.message?.includes("No internet connection")) {
        errorMessage = "No internet connection. Please check your network settings."
      } else if (error.message?.includes("Invalid API key")) {
        errorMessage = "Connection to chat server failed. Please try again later."
      } else if (error.message?.includes("Unable to connect")) {
        errorMessage = "Unable to connect to the chat server. Please try again later."
      }

      Alert.alert("Error", errorMessage)

      // Set empty messages array to avoid showing loading indefinitely
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection()
      setIsConnected(connected)
      if (!connected) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to the chat server. Please check your internet connection or try again later.",
          [{ text: "OK" }],
        )
      }
    }

    checkConnection()
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        // Try to load user from AsyncStorage
        const userJson = await AsyncStorage.getItem("chatUser")

        if (userJson) {
          const user = JSON.parse(userJson)
          setCurrentUser(user)

          // Ensure the user exists in the database
          await ensureUserExists(user)

          setShowAuthModal(false)
        }
      } catch (error: any) {
        console.error("Error checking existing user:", error)
      }
    }

    checkExistingUser()
  }, [])

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!currentUser) return

    // Set up real-time subscription for messages
    const messageSubscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        handleMessageChange,
      )
      .subscribe()

    // Set up real-time subscription for online users
    const presenceSubscription = supabase
      .channel("online-users")
      .on("presence", { event: "sync" }, () => {
        const presenceState = presenceSubscription.presenceState()
        const users = Object.keys(presenceState).map((key) => key)
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceSubscription.track({ user: currentUser.username })
        }
      })

    // Update online status
    updateOnlineStatus(true)

    // Load initial messages
    loadMessages()

    // Clean up subscriptions
    return () => {
      messageSubscription.unsubscribe()
      presenceSubscription.unsubscribe()
      updateOnlineStatus(false)
    }
  }, [currentUser])

  // Update user's online status
  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!currentUser) return

    try {
      // Make sure user exists in the database first
      const userExists = await ensureUserExists(currentUser)

      if (!userExists) {
        console.error("Failed to ensure user exists before updating status")
        return
      }

      // Now update the status
      const { error } = await supabase.from("user_status").upsert({
        user_id: currentUser.username,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })

      if (error) {
        console.error("Error updating online status:", error)
      }
    } catch (error: any) {
      console.error("Error updating online status:", error)
    }
  }

  // Handle real-time message changes
  const handleMessageChange = (payload: any) => {
    switch (payload.eventType) {
      case "INSERT":
        // Add new message to the list
        setMessages((prev) => [...prev, payload.new])
        break
      case "DELETE":
        // Remove deleted message
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        break
    }
  }

  // Register a new user
  const registerUser = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setAuthLoading(true)

    try {
      // Generate random color for user
      const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16)

      // Create user profile
      const newUser: User = {
        username,
        profilePic,
        color: userColor,
        isGuest: false,
        email,
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem("chatUser", JSON.stringify(newUser))

      // Save to Supabase
      const { error: insertError } = await supabase.from("users").insert([
        {
          username,
          email,
          profile_pic: profilePic,
          color: userColor,
          is_guest: false,
        },
      ])

      if (insertError) {
        console.error("Error inserting user:", insertError)
        throw new Error(insertError.message)
      }

      setCurrentUser(newUser)
      setShowAuthModal(false)

      Alert.alert("Success", "Account created successfully!")
    } catch (error: any) {
      console.error("Error registering user:", error)
      Alert.alert("Registration Failed", error.message || "Failed to create account")
    } finally {
      setAuthLoading(false)
    }
  }

  // Login existing user
  const loginUser = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password")
      return
    }

    setAuthLoading(true)

    try {
      // Get user profile
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

      if (userError) throw userError

      if (!userData) throw new Error("User profile not found")

      const user: User = {
        username: userData.username,
        profilePic: userData.profile_pic || null,
        color: userData.color,
        isGuest: userData.is_guest,
        email,
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem("chatUser", JSON.stringify(user))

      setCurrentUser(user)
      setShowAuthModal(false)
    } catch (error: any) {
      console.error("Error logging in:", error)
      Alert.alert("Login Failed", error.message || "Invalid email or password")
    } finally {
      setAuthLoading(false)
    }
  }

  // Join as guest
  const joinAsGuest = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username")
      return
    }

    setAuthLoading(true)

    try {
      // Generate random color for guest
      const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16)
      const guestUsername = username + "_guest"

      // Create guest user
      const guestUser: User = {
        username: guestUsername,
        profilePic,
        color: userColor,
        isGuest: true,
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem("chatUser", JSON.stringify(guestUser))

      // Save to Supabase
      const { error } = await supabase.from("users").insert([
        {
          username: guestUsername,
          profile_pic: profilePic,
          color: userColor,
          is_guest: true,
        },
      ])

      if (error) {
        console.error("Error inserting guest user:", error)
        throw new Error(error.message)
      }

      setCurrentUser(guestUser)
      setShowAuthModal(false)
    } catch (error: any) {
      console.error("Error joining as guest:", error)
      Alert.alert("Error", "Failed to join as guest: " + (error.message || "Unknown error"))
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout user
  const logout = async () => {
    try {
      // Update online status
      await updateOnlineStatus(false)

      // Sign out from Supabase Auth
      if (!currentUser?.isGuest) {
        await supabase.auth.signOut()
      }

      // Clear from AsyncStorage
      await AsyncStorage.removeItem("chatUser")

      setCurrentUser(null)
      setShowAuthModal(true)
    } catch (error: any) {
      console.error("Error logging out:", error)
      Alert.alert("Error", "Failed to log out")
    }
  }

  // Pick profile picture
  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePic(result.assets[0].uri)
      }
    } catch (error: any) {
      console.error("Error picking profile picture:", error)
      Alert.alert("Error", "Failed to pick profile picture")
    }
  }

  // Send a text message
  const sendMessage = async () => {
    if (!currentUser || message.trim() === "") return

    setSending(true)

    try {
      const newMessage = {
        content: message,
        user_id: currentUser.username,
        profile_pic: currentUser.profilePic,
        user_color: currentUser.color,
        type: "text" as const,
        reply_to: replyingTo
          ? {
              id: replyingTo.id,
              user_id: replyingTo.user_id,
              content: replyingTo.content,
              type: replyingTo.type,
            }
          : null,
      }

      // Insert message into Supabase
      const { error } = await supabase.from("messages").insert([newMessage])

      if (error) throw error

      // Clear input and reply
      setMessage("")
      setReplyingTo(null)
    } catch (error: any) {
      console.error("Error sending message:", error)
      Alert.alert("Error", "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  // Pick and send an image
  const pickImage = async () => {
    if (!currentUser) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri
        await uploadAndSendFile(uri, "image")
      }
    } catch (error: any) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  // Upload and send a file (image, audio, etc.)
  const uploadAndSendFile = async (uri: string, type: "image" | "audio" | "file") => {
    if (!currentUser) return

    setSending(true)

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error("File does not exist")
      }

      // Create file name
      const fileExt = uri.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${type === "image" ? "images" : type === "audio" ? "audio" : "files"}/${fileName}`

      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("chat-files").upload(filePath, decode(fileBase64), {
        contentType: type === "image" ? "image/jpeg" : type === "audio" ? "audio/mpeg" : "application/octet-stream",
      })

      if (error) throw error

      // Use the hardcoded supabaseUrl from the supabase.ts file
      const fileUrl = `https://lngppwffukwlgmtkadjm.supabase.co/storage/v1/object/public/chat-files/${filePath}`

      // Send message with file
      const newMessage = {
        content: fileUrl,
        user_id: currentUser.username,
        profile_pic: currentUser.profilePic,
        user_color: currentUser.color,
        type: type,
        reply_to: replyingTo
          ? {
              id: replyingTo.id,
              user_id: replyingTo.user_id,
              content: replyingTo.content,
              type: replyingTo.type,
            }
          : null,
      }

      const { error: msgError } = await supabase.from("messages").insert([newMessage])

      if (msgError) throw msgError

      // Clear reply if any
      setReplyingTo(null)
    } catch (error: any) {
      console.error("Error uploading file:", error)
      Alert.alert("Error", "Failed to upload file")
    } finally {
      setSending(false)
    }
  }

  // Start audio recording
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please grant microphone permissions to record audio")
        return
      }

      // Set up recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      // Start recording
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.startAsync()

      setRecording(recording)
      setIsRecording(true)

      // Start timer
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error: any) {
      console.error("Error starting recording:", error)
      Alert.alert("Error", "Failed to start recording")
    }
  }

  // Stop audio recording and send
  const stopRecording = async () => {
    if (!recording || !currentUser) return

    try {
      // Stop recording
      await recording.stopAndUnloadAsync()

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }

      // Get recording URI
      const uri = recording.getURI()
      if (!uri) throw new Error("Recording URI is null")

      // Upload and send
      await uploadAndSendFile(uri, "audio")
    } catch (error: any) {
      console.error("Error stopping recording:", error)
      Alert.alert("Error", "Failed to process recording")
    } finally {
      setRecording(null)
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from("messages").delete().match({ id: messageId })

      if (error) throw error
    } catch (error: any) {
      console.error("Error deleting message:", error)
      Alert.alert("Error", "Failed to delete message")
    }
  }

  // Start replying to a message
  const startReply = (message: ChatMessage) => {
    setReplyingTo(message)
  }

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Switch chat room
  const switchChatRoom = (roomId: string) => {
    setChatRooms(
      chatRooms.map((room) => ({
        ...room,
        active: room.id === roomId,
      })),
    )

    // In a real app, you would fetch messages for the selected room
    setMessages([])
    setLoading(true)

    // Simulate loading messages for the new room
    setTimeout(() => {
      const foundRoom = chatRooms.find((r) => r.id === roomId)
      const roomName = foundRoom ? foundRoom.name : "Chat Room"

      const newRoomMessages: ChatMessage[] = [
        {
          id: "101",
          content: `Welcome to the ${roomName}!`,
          user_id: "System",
          type: "text",
          created_at: new Date().toISOString(),
        },
      ]

      setMessages(newRoomMessages)
      setLoading(false)
    }, 500)
  }

  // Format time from ISO string
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render a message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = currentUser && item.user_id === currentUser.username

    // Determine content based on message type
    let messageContent
    switch (item.type) {
      case "image":
        messageContent = <Image source={{ uri: item.content }} style={styles.messageImage} resizeMode="cover" />
        break
      case "audio":
        messageContent = (
          <View style={styles.audioContainer}>
            <Ionicons name="musical-note" size={20} color="#FFD700" />
            <Text style={styles.audioText}>Voice Message</Text>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )
        break
      case "file":
        const fileName = item.content.split("/").pop() || "file"
        messageContent = (
          <View style={styles.fileContainer}>
            <Ionicons name="document" size={20} color="#FFD700" />
            <Text style={styles.fileText} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
        )
        break
      default:
        messageContent = <Text style={styles.messageText}>{item.content}</Text>
    }

    // Render reply preview if exists
    const replyPreview = item.reply_to ? (
      <View style={styles.replyPreview}>
        <Text style={styles.replyUsername}>{item.reply_to.user_id}</Text>
        <Text style={styles.replyContent} numberOfLines={1}>
          {item.reply_to.type === "image"
            ? "📷 Photo"
            : item.reply_to.type === "audio"
              ? "🎵 Voice message"
              : item.reply_to.type === "file"
                ? "📎 File"
                : item.reply_to.content}
        </Text>
      </View>
    ) : null

    // Check if user is online
    const isUserOnline = onlineUsers.includes(item.user_id)

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            {item.profile_pic ? (
              <Image source={{ uri: item.profile_pic }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: item.user_color || "#FFD700" }]}>
                <Text style={styles.defaultAvatarText}>{item.user_id.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {isUserOnline && <View style={styles.onlineIndicator} />}
          </View>
        )}
        <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          {!isCurrentUser && (
            <Text style={[styles.senderName, { color: item.user_color || "#FFD700" }]}>
              {item.user_id}
              {item.user_id.includes("_guest") && <Text style={styles.guestTag}> (Guest)</Text>}
            </Text>
          )}

          {replyPreview}
          {messageContent}

          <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>

          <View style={styles.messageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => startReply(item)}>
              <Ionicons name="return-down-back" size={16} color="#FFD700" />
            </TouchableOpacity>

            {isCurrentUser && (
              <TouchableOpacity style={styles.actionButton} onPress={() => deleteMessage(item.id)}>
                <Ionicons name="trash" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  // Render a chat room tab
  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[styles.roomTab, item.active && styles.activeRoomTab]}
      onPress={() => switchChatRoom(item.id)}
    >
      <Text style={[styles.roomName, item.active && styles.activeRoomName]}>{item.name}</Text>
    </TouchableOpacity>
  )

  // Render authentication modal
  const renderAuthModal = () => (
    <Modal visible={showAuthModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={["#8B0000", "#800080"]} style={styles.authContainer}>
          <Text style={styles.authTitle}>
            {authMode === "login" ? "Login" : authMode === "register" ? "Create Account" : "Join as Guest"}
          </Text>

          {/* Username input (for register and guest) */}
          {authMode !== "login" && (
            <TextInput
              style={styles.authInput}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
          )}

          {/* Email and password (for login and register) */}
          {authMode !== "guest" && (
            <>
              <TextInput
                style={styles.authInput}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.authInput}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}

          {/* Profile picture (optional for all) */}
          <View style={styles.profilePicContainer}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profilePicPreview} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Ionicons name="person" size={40} color="#FFD700" />
              </View>
            )}

            <TouchableOpacity style={styles.profilePicButton} onPress={pickProfilePicture}>
              <Text style={styles.profilePicButtonText}>
                {profilePic ? "Change Picture" : "Add Picture (Optional)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={authMode === "login" ? loginUser : authMode === "register" ? registerUser : joinAsGuest}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator size="small" color="#8B0000" />
            ) : (
              <Text style={styles.authButtonText}>
                {authMode === "login" ? "Login" : authMode === "register" ? "Create Account" : "Join Chat"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch mode links */}
          <View style={styles.authLinks}>
            {authMode === "login" && (
              <>
                <TouchableOpacity onPress={() => setAuthMode("register")}>
                  <Text style={styles.authLinkText}>Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAuthMode("guest")}>
                  <Text style={styles.authLinkText}>Join as Guest</Text>
                </TouchableOpacity>
              </>
            )}

            {authMode === "register" && (
              <>
                <TouchableOpacity onPress={() => setAuthMode("login")}>
                  <Text style={styles.authLinkText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAuthMode("guest")}>
                  <Text style={styles.authLinkText}>Join as Guest</Text>
                </TouchableOpacity>
              </>
            )}

            {authMode === "guest" && (
              <>
                <TouchableOpacity onPress={() => setAuthMode("login")}>
                  <Text style={styles.authLinkText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAuthMode("register")}>
                  <Text style={styles.authLinkText}>Create Account</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  )

  // Render offline fallback
  const renderOfflineFallback = () => (
    <View style={styles.offlineContainer}>
      <Ionicons name="cloud-offline" size={64} color="#FFD700" />
      <Text style={styles.offlineTitle}>Connection Error</Text>
      <Text style={styles.offlineMessage}>Unable to connect to the chat server. This could be due to:</Text>
      <View style={styles.offlineList}>
        <Text style={styles.offlineListItem}>• Internet connection issues</Text>
        <Text style={styles.offlineListItem}>• Server maintenance</Text>
        <Text style={styles.offlineListItem}>• Configuration problems</Text>
      </View>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setLoading(true)
          checkSupabaseConnection().then((isConnected) => {
            if (isConnected && currentUser) {
              loadMessages()
            } else {
              setLoading(false)
              Alert.alert("Still Offline", "Unable to connect to the chat server. Please try again later.")
            }
          })
        }}
      >
        <Text style={styles.retryButtonText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  )

  // Modify the return statement to show the offline fallback when not connected
  return (
    <LinearGradient colors={["#8B0000", "#800080"]} style={styles.container}>
      {renderAuthModal()}

      {!isConnected && !loading ? (
        renderOfflineFallback()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Live Chat</Text>
            <View style={styles.headerUserInfo}>
              <Text style={styles.headerSubtitle}>
                {currentUser ? `Chatting as ${currentUser.username}` : "Connect with the community"}
              </Text>
              {currentUser && (
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.onlineCount}>{onlineUsers.length} online</Text>
          </View>

          <View style={styles.roomTabs}>
            <FlatList
              data={chatRooms}
              renderItem={renderChatRoom}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {replyingTo && (
            <View style={styles.replyContainer}>
              <View style={styles.replyContent}>
                <Text style={styles.replyingToText}>Replying to {replyingTo.user_id}</Text>
                <Text style={styles.replyingToContent} numberOfLines={1}>
                  {replyingTo.type === "image"
                    ? "📷 Photo"
                    : replyingTo.type === "audio"
                      ? "🎵 Voice message"
                      : replyingTo.type === "file"
                        ? "📎 File"
                        : replyingTo.content}
                </Text>
              </View>
              <TouchableOpacity style={styles.cancelReplyButton} onPress={cancelReply}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingText}>Recording... {formatRecordingTime(recordingTime)}</Text>
              <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
                <Ionicons name="stop" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            style={styles.inputContainer}
          >
            {/* <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
              <Ionicons name="attach" size={24} color="#FFD700" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attachButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={24} color={isRecording ? "#ff4444" : "#FFD700"} />
            </TouchableOpacity> */}

            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              editable={!isRecording}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={sending || message.trim() === "" || isRecording}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#8B0000" />
              ) : (
                <Ionicons name="send" size={24} color="#8B0000" />
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    padding: 15,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    marginLeft: 10,
    padding: 5,
  },
  onlineCount: {
    fontSize: 12,
    color: "#FFD700",
    marginTop: 5,
  },
  roomTabs: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 10,
  },
  roomTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  activeRoomTab: {
    backgroundColor: "#FFD700",
  },
  roomName: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  activeRoomName: {
    color: "#8B0000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "80%",
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherUserMessage: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  defaultAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: "100%",
  },
  currentUserBubble: {
    backgroundColor: "#FFD700",
    borderBottomRightRadius: 0,
  },
  otherUserBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderBottomLeftRadius: 0,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },
  guestTag: {
    fontStyle: "italic",
    fontSize: 10,
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 5,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 8,
    marginVertical: 5,
  },
  audioText: {
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
  },
  playButton: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 8,
    marginVertical: 5,
  },
  fileText: {
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  actionButton: {
    padding: 5,
    marginLeft: 8,
  },
  replyPreview: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#FFD700",
  },
  replyUsername: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFD700",
  },
  replyContent: {
    fontSize: 10,
    flex: 1,
    color: "rgba(255, 255, 255, 0.7)",
  },
  replyContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
  },
  replyingToContent: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  cancelReplyButton: {
    padding: 5,
  },
  recordingContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff4444",
    marginRight: 8,
  },
  recordingText: {
    color: "#FFFFFF",
    flex: 1,
  },
  stopRecordingButton: {
    backgroundColor: "rgba(255, 0, 0, 0.5)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  recordingButton: {
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#FFFFFF",
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    width: "85%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  authInput: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  profilePicContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  profilePicPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profilePicPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profilePicButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profilePicButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  authButton: {
    width: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  authButtonText: {
    color: "#8B0000",
    fontSize: 16,
    fontWeight: "bold",
  },
  authLinks: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  authLinkText: {
    color: "#FFD700",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
  },
  offlineMessage: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  offlineList: {
    alignSelf: "flex-start",
    marginBottom: 30,
  },
  offlineListItem: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#8B0000",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default ChatScreen

