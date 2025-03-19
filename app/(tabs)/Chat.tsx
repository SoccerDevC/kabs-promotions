"use client"

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
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import { Audio } from "expo-av"
import { supabase, decode, initializeNewUser } from "../utils/supabase"

// Define types for our data
interface ChatMessage {
  id: string
  content: string
  user_id: string
  profile_pic?: string
  user_color?: string
  type: "text" | "image" | "audio" | "file"
  created_at: string
  reply_to?: {
    id: string
    user_id: string
    content: string
    type?: string
  } | null
}

interface ChatRoom {
  id: string
  name: string
  active: boolean
}

interface User {
  username: string
  profilePic: string
  color: string
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

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    { id: "1", name: "General Chat", active: true },
    { id: "2", name: "Music Lovers", active: false },
    { id: "3", name: "Events & Promotions", active: false },
    { id: "4", name: "Gaming", active: false },
  ])

  const flatListRef = useRef<FlatList | null>(null)

  // Initialize user on first load
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to load user from AsyncStorage
        const userJson = await AsyncStorage.getItem("chatUser")

        if (userJson) {
          setCurrentUser(JSON.parse(userJson))
        } else {
          // Create a new user if none exists
          const newUser = await initializeNewUser()
          setCurrentUser(newUser)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        // Create a new user if there's an error
        const newUser = await initializeNewUser()
        setCurrentUser(newUser)
      }
    }

    loadUser()
  }, [])

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!currentUser) return

    const loadMessages = async () => {
      setLoading(true)
      try {
        // Fetch messages from Supabase
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        // Reverse to show oldest first
        setMessages(data.reverse())
      } catch (error) {
        console.error("Error loading messages:", error)
        Alert.alert("Error", "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    // Set up real-time subscription
    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        handleDatabaseChange,
      )
      .subscribe()

    loadMessages()

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [currentUser])

  // Handle real-time database changes
  const handleDatabaseChange = (payload: any) => {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        {!isCurrentUser && (
          <Image
            source={{
              uri: item.profile_pic || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
            }}
            style={styles.avatar}
          />
        )}
        <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          {!isCurrentUser && (
            <Text style={[styles.senderName, { color: item.user_color || "#FFD700" }]}>{item.user_id}</Text>
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

  return (
    <LinearGradient colors={["#8B0000", "#800080"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Chat</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser ? `Chatting as ${currentUser.username}` : "Connect with the community"}
        </Text>
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
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Ionicons name="attach" size={24} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.attachButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={24} color={isRecording ? "#ff4444" : "#FFD700"} />
        </TouchableOpacity>

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
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:20
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
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
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
    flex:1,
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
    animationName: "pulse",
    animationDuration: "2s",
    animationIterationCount: "infinite",
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
})

export default ChatScreen

