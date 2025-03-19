import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home-outline"; // Default icon

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Radio") {
              iconName = focused ? "radio" : "radio-outline";
            } else if (route.name === "Chat") {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            } else if (route.name === "Tv Hub") {
              iconName = focused ? "tv" : "tv-outline";
            } else if (route.name === "Shop") {
              iconName = focused ? "cart" : "cart-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          initialRouteName: "Home",
          tabBarActiveTintColor: "#FFD700", // Gold
          tabBarInactiveTintColor: "#FFFFFF", // White
          tabBarStyle: {
            backgroundColor: "#8B0000", // Dark Red
            borderTopWidth: 0,
          },
          headerStyle: {
            backgroundColor: "#8B0000", // Dark Red
          },
          headerTintColor: "#FFFFFF", // White
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown:false
        })}
      >
        {/* Define Tab Screens */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Kabs Play",
          }}
        />
        <Tabs.Screen
          name="Radio"
          options={{
            title: "Radio",
          }}
        />
        <Tabs.Screen
          name="Chat"
          options={{
            title: "Chat",
          }}
        />
        <Tabs.Screen
          name="TvHub"
          options={{
            title: "TV",
          }}
        />
        <Tabs.Screen
          name="Shop"
          options={{
            title: "Shop",
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}