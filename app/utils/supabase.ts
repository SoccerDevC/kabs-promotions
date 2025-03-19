import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"
import * as FileSystem from "expo-file-system"

// Initialize Supabase client with hardcoded URL and key
// In production, use environment variables instead
const supabaseUrl = "https://lngppwffukwlgmtkadjm.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZ3Bwd2ZmdWt3bGdtdGthZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NDkzMTIsImV4cCI6MjA1NjAyNTMxMn0.nAn48WYq5aUUJVYexOkPwUvNljjQq_ZRSP4qzaKOedU"

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Helper function to decode base64 for file uploads
export const decode = (base64: string) => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

// Function to get a random color for user
export const getRandomColor = () => {
  const colors = ["#FFD700", "#FFA500", "#FF69B4", "#00CED1", "#98FB98", "#DDA0DD", "#F0E68C", "#87CEEB"]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Initialize a new user
export const initializeNewUser = async () => {
  const randomId = Math.random().toString(36).substr(2, 6)
  const newUser = {
    username: "Guest_" + randomId,
    profilePic: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    color: getRandomColor(),
  }

  // Save to AsyncStorage
  await AsyncStorage.setItem("chatUser", JSON.stringify(newUser))

  return newUser
}

// Upload file to Supabase storage
export const uploadFile = async (uri: string, type: "image" | "audio" | "file") => {
  try {
    // Get file info from FileSystem
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

    // Return public URL
    return `${supabaseUrl}/storage/v1/object/public/chat-files/${filePath}`
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Add a default export to satisfy Expo Router
export default { supabase, decode, getRandomColor, initializeNewUser, uploadFile }

