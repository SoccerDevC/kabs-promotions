"use client"

import type React from "react"

import { useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserRegistrationProps {
  onRegister: (user: User) => void
  supabase: SupabaseClient
}

export default function UserRegistration({ onRegister, supabase }: UserRegistrationProps) {
  const [username, setUsername] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Generate a random color for the user
  const generateRandomColor = () => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#33A8FF", "#A833FF", "#FFD700", "#00CED1"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    if (!profileImage) {
      setError("Please upload a profile image")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Upload profile image to Supabase Storage
      const fileName = `${Date.now()}_${profileImage.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, profileImage)

      if (uploadError) throw uploadError

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(fileName)

      const imageUrl = urlData.publicUrl

      // Create user object
      const newUser: User = {
        username: username.trim(),
        profilePic: imageUrl,
        color: generateRandomColor(),
      }

      // Save user to Supabase
      const { error: userError } = await supabase.from("users").insert([
        {
          username: newUser.username,
          profile_pic: newUser.profilePic,
          color: newUser.color,
        },
      ])

      if (userError) throw userError

      // Call the onRegister callback
      onRegister(newUser)
    } catch (error) {
      console.error("Error registering user:", error)
      setError("Failed to register. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Join the Chat</CardTitle>
          <CardDescription>Enter your name and upload a profile picture to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-6 flex flex-col items-center">
              <Avatar
                className="h-24 w-24 cursor-pointer"
                onClick={() => document.getElementById("profile-upload")?.click()}
              >
                <AvatarImage src={previewUrl} />
                <AvatarFallback className="bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <p className="mt-2 text-sm text-muted-foreground">Click to upload profile picture</p>
            </div>

            <div className="mb-4 space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Joining...
              </>
            ) : (
              "Join Chat"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

