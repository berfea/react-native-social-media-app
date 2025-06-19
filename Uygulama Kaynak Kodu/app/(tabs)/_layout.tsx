import { Tabs } from "expo-router";
import * as Icons from "@expo/vector-icons";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { height: 70 },
        headerTitleStyle: { color: "#0080ff", marginTop: -10 },
        headerTitleAlign: "center",
        headerStatusBarHeight: -20,
        animation: "shift",
        headerStyle: { shadowColor: "#ffffff" },
        tabBarButton: (props) => <TouchableOpacity {...(props as TouchableOpacityProps)} />,
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          headerTitle: "Ana Sayfa",
          title: "Akış",
          tabBarLabelStyle: { fontSize: 14.5, paddingTop: 2 },
          tabBarIcon: ({ color }) => <Icons.Octicons name="home" size={26} color={color} />,
          tabBarIconStyle: { marginTop: 3 },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          tabBarLabelStyle: { fontSize: 14, paddingTop: 3 },
          tabBarIcon: ({ color }) => <Icons.FontAwesome6 name="magnifying-glass" size={23} color={color} />,
          tabBarIconStyle: { marginTop: 2 },
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: "Paylaş",
          tabBarLabelStyle: { fontSize: 14, paddingTop: 2 },
          tabBarIcon: ({ color }) => <Icons.Feather name="share" size={27} color={color} />,
          tabBarIconStyle: { marginTop: 2.5 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabelStyle: { fontSize: 14, paddingTop: 2 },
          tabBarIcon: ({ color }) => <Icons.Octicons name="person" size={29} color={color} />,
          tabBarIconStyle: { marginTop: 3 },
        }}
      />
    </Tabs>
  );
}
