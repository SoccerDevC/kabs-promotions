export interface User {
  username: string
  profilePic: string
  color: string
}

export interface ChatMessage {
  id: string
  content: string
  user_id: string
  profile_pic?: string
  user_color?: string
  type: "text" | "image" | "audio" | "file"
  created_at: string
  room_id: string
  reply_to?: {
    id: string
    user_id: string
    content: string
    type?: string
  } | null
}

export interface ChatRoom {
  id: string
  name: string
  active: boolean
}

