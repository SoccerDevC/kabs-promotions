// Decode base64 string for Supabase storage
export const decode = (str: string): Uint8Array => {
    const binaryString = atob(str)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
  
  // Initialize a new user with random color
  export const initializeNewUser = () => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#33A8FF", "#A833FF", "#FFD700", "#00CED1"]
  
    return {
      username: "Guest" + Math.floor(Math.random() * 1000),
      profilePic: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  }
  
  