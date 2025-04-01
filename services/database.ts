// Replace the entire file with this Supabase implementation

import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Initialize Supabase client
// Replace with your Supabase URL and anon key
const supabaseUrl = "YOUR_SUPABASE_URL"
const supabaseKey = "YOUR_SUPABASE_ANON_KEY"

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Initialize database tables if they don't exist
export const initializeDatabase = async () => {
  try {
    // Check if database is already initialized
    const { data: initialized } = await supabase.from("virtual_events").select("count").limit(1)

    if (initialized && initialized.length > 0) return

    // Create sample data for each table
    await createSampleData()

    console.log("Database initialized with sample data")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// Create sample data for testing
const createSampleData = async () => {
  // Sample virtual events
  const events = [
    {
      id: uuidv4(),
      title: "Kampala Music Festival",
      description: "Annual music celebration featuring top Ugandan artists and international guests",
      date: "2025-05-15",
      time: "6:00 PM - 10:00 PM",
      image_url: "https://img.icons8.com/color/96/000000/concert.png",
      status: "upcoming",
      features: {
        liveStream: true,
        breakoutRooms: true,
        networking: true,
        qa: true,
      },
      attendees: 1250,
    },
    {
      id: uuidv4(),
      title: "Business Innovation Summit",
      description: "Connect with industry leaders and discover emerging business trends",
      date: "2025-04-10",
      time: "9:00 AM - 4:00 PM",
      image_url: "https://img.icons8.com/color/96/000000/business.png",
      status: "live",
      features: {
        liveStream: true,
        breakoutRooms: true,
        networking: true,
        qa: true,
      },
      attendees: 780,
    },
    {
      id: uuidv4(),
      title: "Tech Startup Showcase",
      description: "Highlighting Uganda's most promising tech startups and innovations",
      date: "2025-04-25",
      time: "2:00 PM - 6:00 PM",
      image_url: "https://img.icons8.com/color/96/000000/idea.png",
      status: "upcoming",
      features: {
        liveStream: true,
        breakoutRooms: false,
        networking: true,
        qa: true,
      },
      attendees: 450,
    },
  ]

  // Insert events
  const { error: eventsError } = await supabase.from("virtual_events").insert(events)

  if (eventsError) {
    console.error("Error inserting events:", eventsError)
    return
  }

  // Create sample livestreams
  const liveStreams = [
    {
      id: uuidv4(),
      event_id: events[1].id, // Business Innovation Summit
      title: "Opening Keynote",
      description: "Welcome address and industry overview",
      stream_url: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      host_name: "Kabs Promotions",
      viewer_count: 325,
      status: "live",
      started_at: new Date().toISOString(),
    },
  ]

  // Insert livestreams
  const { error: streamsError } = await supabase.from("live_streams").insert(liveStreams)

  if (streamsError) {
    console.error("Error inserting livestreams:", streamsError)
  }

  // Create sample livestream comments
  const comments = [
    {
      id: uuidv4(),
      stream_id: liveStreams[0].id,
      user_id: "user1",
      user_name: "Sarah M.",
      text: "The sound quality is amazing! 🎵",
      is_host: false,
      created_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago,
    },
    {
      id: uuidv4(),
      stream_id: liveStreams[0].id,
      user_id: "host1",
      user_name: "Kabs Promotions",
      text: "Welcome everyone! We're excited to bring you this amazing event.",
      is_host: true,
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago,
    },
  ]

  // Insert comments
  const { error: commentsError } = await supabase.from("live_stream_comments").insert(comments)

  if (commentsError) {
    console.error("Error inserting comments:", commentsError)
  }

  // Create sample breakout rooms
  const breakoutRooms = [
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "Marketing Your Business",
      topic: "Strategies for promoting your business in the digital age",
      host_id: "host2",
      host_name: "Sarah K.",
      max_participants: 25,
      participants: 18,
      status: "open",
      image_url: "https://img.icons8.com/color/96/000000/commercial.png",
    },
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "Funding Opportunities",
      topic: "Exploring investment and grant options for Ugandan startups",
      host_id: "host3",
      host_name: "David M.",
      max_participants: 20,
      participants: 20,
      status: "full",
      image_url: "https://img.icons8.com/color/96/000000/money-bag.png",
    },
  ]

  // Insert breakout rooms
  const { error: roomsError } = await supabase.from("breakout_rooms").insert(breakoutRooms)

  if (roomsError) {
    console.error("Error inserting breakout rooms:", roomsError)
  }

  // Create sample networking tables
  const networkingTables = [
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "Business Networking",
      topic: "Connect with professionals from all areas of business",
      participants: 5,
      max_participants: 8,
    },
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "Investor Connections",
      topic: "Meet potential investors for your startup",
      participants: 3,
      max_participants: 6,
    },
  ]

  // Insert networking tables
  const { error: tablesError } = await supabase.from("networking_tables").insert(networkingTables)

  if (tablesError) {
    console.error("Error inserting networking tables:", tablesError)
  }

  // Create sample attendees
  const attendees = [
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "Sarah Johnson",
      role: "Business Consultant",
      company: "Harmony Consulting",
      image_url: "https://randomuser.me/api/portraits/women/1.jpg",
      interests: ["Business Strategy", "Marketing", "Entrepreneurship"],
      is_online: true,
    },
    {
      id: uuidv4(),
      event_id: events[1].id,
      name: "David Kimani",
      role: "Startup Founder",
      company: "TechVentures Uganda",
      image_url: "https://randomuser.me/api/portraits/men/2.jpg",
      interests: ["Technology", "Innovation", "Funding"],
      is_online: true,
    },
  ]

  // Insert attendees
  const { error: attendeesError } = await supabase.from("attendees").insert(attendees)

  if (attendeesError) {
    console.error("Error inserting attendees:", attendeesError)
  }

  // Create sample QA sessions
  const qaSessions = [
    {
      id: uuidv4(),
      event_id: events[1].id,
      title: "Business Innovation Q&A",
      description: "Ask our panel of experts about business innovation",
      status: "active",
    },
  ]

  // Insert QA sessions
  const { error: sessionsError } = await supabase.from("qa_sessions").insert(qaSessions)

  if (sessionsError) {
    console.error("Error inserting QA sessions:", sessionsError)
  }

  // Create sample questions
  const questions = [
    {
      id: uuidv4(),
      session_id: qaSessions[0].id,
      user_id: "user3",
      user_name: "Michael K.",
      text: "What advice do you have for emerging businesses trying to innovate in a traditional market?",
      upvotes: 24,
      is_answered: true,
      answer:
        "Focus on solving real customer pain points while respecting traditional values. Innovation doesn't have to disrupt everything - sometimes it can enhance existing practices.",
    },
    {
      id: uuidv4(),
      session_id: qaSessions[0].id,
      user_id: "user4",
      user_name: "Sarah N.",
      text: "How important is social media for business promotion in Uganda?",
      upvotes: 18,
      is_answered: true,
      answer:
        "Social media is absolutely essential in Uganda's business landscape. Platforms like Instagram, WhatsApp, and Facebook are powerful tools for reaching customers directly and building your brand.",
    },
    {
      id: uuidv4(),
      session_id: qaSessions[0].id,
      user_id: "user5",
      user_name: "David M.",
      text: "What are the biggest challenges facing Ugandan businesses today?",
      upvotes: 15,
      is_answered: false,
    },
  ]

  // Insert questions
  const { error: questionsError } = await supabase.from("questions").insert(questions)

  if (questionsError) {
    console.error("Error inserting questions:", questionsError)
  }
}

// Generic CRUD operations for any table
export const getAll = async (tableName: string) => {
  try {
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error getting all from ${tableName}:`, error)
    return []
  }
}

export const getById = async (tableName: string, id: string) => {
  try {
    const { data, error } = await supabase.from(tableName).select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error getting by id from ${tableName}:`, error)
    return null
  }
}

export const create = async (tableName: string, item: any) => {
  try {
    const newItem = { ...item, id: item.id || uuidv4() }
    const { data, error } = await supabase.from(tableName).insert(newItem).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error creating in ${tableName}:`, error)
    return null
  }
}

export const update = async (tableName: string, id: string, updates: any) => {
  try {
    const { data, error } = await supabase.from(tableName).update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error updating in ${tableName}:`, error)
    return null
  }
}

export const remove = async (tableName: string, id: string) => {
  try {
    const { error } = await supabase.from(tableName).delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error removing from ${tableName}:`, error)
    return false
  }
}

// Specific queries for virtual events
export const getEventsByStatus = async (status: "upcoming" | "live" | "ended") => {
  try {
    const { data, error } = await supabase.from("virtual_events").select("*").eq("status", status)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting events by status:", error)
    return []
  }
}

// Specific queries for livestreams
export const getLiveStreamsByEventId = async (eventId: string) => {
  try {
    const { data, error } = await supabase.from("live_streams").select("*").eq("event_id", eventId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting livestreams by event id:", error)
    return []
  }
}

export const getCommentsByStreamId = async (streamId: string) => {
  try {
    const { data, error } = await supabase
      .from("live_stream_comments")
      .select("*")
      .eq("stream_id", streamId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting comments by stream id:", error)
    return []
  }
}

// Specific queries for breakout rooms
export const getBreakoutRoomsByEventId = async (eventId: string) => {
  try {
    const { data, error } = await supabase.from("breakout_rooms").select("*").eq("event_id", eventId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting breakout rooms by event id:", error)
    return []
  }
}

// Specific queries for networking
export const getNetworkingTablesByEventId = async (eventId: string) => {
  try {
    const { data, error } = await supabase.from("networking_tables").select("*").eq("event_id", eventId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting networking tables by event id:", error)
    return []
  }
}

export const getAttendeesByEventId = async (eventId: string) => {
  try {
    const { data, error } = await supabase.from("attendees").select("*").eq("event_id", eventId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting attendees by event id:", error)
    return []
  }
}

// Specific queries for Q&A
export const getQASessionsByEventId = async (eventId: string) => {
  try {
    const { data, error } = await supabase.from("qa_sessions").select("*").eq("event_id", eventId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting QA sessions by event id:", error)
    return []
  }
}

export const getQuestionsBySessionId = async (sessionId: string) => {
  try {
    const { data, error } = await supabase.from("questions").select("*").eq("session_id", sessionId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting questions by session id:", error)
    return []
  }
}

// Add a question upvote
export const upvoteQuestion = async (questionId: string) => {
  try {
    // First get the current question to get the upvotes count
    const { data: question, error: getError } = await supabase
      .from("questions")
      .select("upvotes")
      .eq("id", questionId)
      .single()

    if (getError) throw getError

    // Update the upvotes count
    const { data, error } = await supabase
      .from("questions")
      .update({ upvotes: (question.upvotes || 0) + 1 })
      .eq("id", questionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error upvoting question:", error)
    return null
  }
}

// Start a new livestream
export const startLiveStream = async (eventId: string, streamData: any) => {
  try {
    const newStream = {
      id: uuidv4(),
      event_id: eventId,
      status: "live",
      viewer_count: 0,
      started_at: new Date().toISOString(),
      ...streamData,
    }

    const { data, error } = await supabase.from("live_streams").insert(newStream).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error starting livestream:", error)
    return null
  }
}

// Join a livestream (increment viewer count)
export const joinLiveStream = async (streamId: string) => {
  try {
    // First get the current stream to get the viewer count
    const { data: stream, error: getError } = await supabase
      .from("live_streams")
      .select("viewer_count")
      .eq("id", streamId)
      .single()

    if (getError) throw getError

    // Update the viewer count
    const { data, error } = await supabase
      .from("live_streams")
      .update({ viewer_count: (stream.viewer_count || 0) + 1 })
      .eq("id", streamId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error joining livestream:", error)
    return null
  }
}

// Create a breakout room
export const createBreakoutRoom = async (eventId: string, roomData: any) => {
  try {
    const newRoom = {
      id: uuidv4(),
      event_id: eventId,
      status: "open",
      participants: 1, // Host is first participant
      ...roomData,
    }

    const { data, error } = await supabase.from("breakout_rooms").insert(newRoom).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating breakout room:", error)
    return null
  }
}

// Join a breakout room
export const joinBreakoutRoom = async (roomId: string) => {
  try {
    // First get the current room to get the participant count
    const { data: room, error: getError } = await supabase
      .from("breakout_rooms")
      .select("participants, max_participants, status")
      .eq("id", roomId)
      .single()

    if (getError) throw getError

    // Check if room is full
    if (room.participants >= room.max_participants) {
      return null
    }

    // Update participant count and status if needed
    const newStatus = room.participants + 1 >= room.max_participants ? "full" : "open"

    const { data, error } = await supabase
      .from("breakout_rooms")
      .update({
        participants: room.participants + 1,
        status: newStatus,
      })
      .eq("id", roomId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error joining breakout room:", error)
    return null
  }
}

