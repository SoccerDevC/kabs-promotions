import { Platform } from "react-native"
import "react-native-url-polyfill/auto"
import { toByteArray } from "base64-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { AppState } from "react-native"


const supabaseUrl = "https://gnnpqsiuppddecqbgrlk.supabase.co"
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubnBxc2l1cHBkZGVjcWJncmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MTA2ODQsImV4cCI6MjA1ODA4NjY4NH0.37iD13ZGc6q3VSTCZCGV8ckzWUqpG16y4yiXuK9JNEk"

// Create a Supabase client with proper React Native configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export const decode = (base64String: string): Uint8Array => {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    const bytes = toByteArray(base64String)
    return bytes
  } else {
    const binaryString = atob(base64String)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}

// Initialize a new user with random color and default settings
export const initializeNewUser = async () => {
  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`
  const userColor = "#" + Math.floor(Math.random() * 16777215).toString(16)

  const newUser = {
    username: guestId,
    profilePic: null,
    color: userColor,
    isGuest: true,
  }

  // Save to AsyncStorage
  await AsyncStorage.setItem("chatUser", JSON.stringify(newUser))

  return newUser
}

// Define types for database tables
export interface Message {
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

export interface UserProfile {
  username: string
  email?: string
  profile_pic?: string | null
  color: string
  is_guest: boolean
}

// Check if Supabase connection is working
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Use the ping function we created
    const { data, error } = await supabase.rpc("ping")

    // If there's no error, connection is working
    return !error && data === "pong"
  } catch (error) {
    console.error("Supabase connection check failed:", error)
    return false
  }
}

// Ensure user exists in the database
export const ensureUserExists = async (user: {
  username: string
  profilePic: string | null
  color: string
  isGuest: boolean
}): Promise<boolean> => {
  try {
    // Check if user exists
    const { data, error } = await supabase.from("users").select("username").eq("username", user.username).single()

    if (error || !data) {
      // User doesn't exist, create them
      const { error: insertError } = await supabase.from("users").insert([
        {
          username: user.username,
          profile_pic: user.profilePic,
          color: user.color,
          is_guest: user.isGuest,
        },
      ])

      if (insertError) {
        console.error("Error creating user:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error ensuring user exists:", error)
    return false
  }
}

