// app/profile.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { SERVER_ADDRESS } from "../index";
import { createThumbnail } from "react-native-create-thumbnail";
import * as Icons from "@expo/vector-icons";

interface Post {
  mediaPath: string;
  type: "image" | "video";
}

const Profile = () => {
  const { username } = useGlobalSearchParams<{ username: string }>();
  const router = useRouter();

  const [profilePhoto, setProfilePhoto] = useState<string>("default.jpg");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followInput, setFollowInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [thumbs, setThumbs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${SERVER_ADDRESS}/profile/${username}`);
      const data = await response.json();
      setProfilePhoto(data.profilePhoto);
      setFollowersCount(data.followers.length);
      setFollowingCount(data.following.length);
      const reversedPosts = [...data.posts].reverse();
      setPosts(reversedPosts);
      generateThumbnails(reversedPosts);
    } catch (e) {
      Alert.alert("Hata", "Profil verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnails = async (media: Post[]) => {
    let thumbMap: { [key: number]: string } = {};
    await Promise.all(
      media.map(async (item: Post, i: number) => {
        if (item.type === "video") {
          try {
            const { path } = await createThumbnail({url: `${SERVER_ADDRESS}/file/${item.mediaPath}`});
            thumbMap[i] = path;
          } catch {
            thumbMap[i] = "";
          }
        }
      })
    );
    setThumbs(thumbMap);
  };

  const renderMedia = ({ item, index }: { item: Post; index: number }) => {
    const source =
      item.type === "image"
        ? { uri: `${SERVER_ADDRESS}/file/${item.mediaPath}` }
        : thumbs[index]
        ? { uri: thumbs[index] }
        : null;

    return (
      <View style={styles.mediaBox}>
        {source ? (
          <Image source={source} style={styles.mediaThumb} resizeMode="cover" />
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <Image
          source={require("../../assets/images/default.jpg")}
          style={styles.avatar}
        />
        <View style={styles.stats}>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.infoText}>Paylaşım: {posts.length}</Text>
          <Text style={styles.infoText}>Takipçi: {followersCount}</Text>
          <Text style={styles.infoText}>Takip edilen: {followingCount}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007aff" />
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMedia}
          contentContainerStyle={styles.grid}
        />
      )}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  input: {
    borderColor: "#007aff",
    borderWidth: 1.5,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  stats: {
    marginLeft: 40,
    gap: 6,
  },
  username: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007aff",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  grid: {
    gap: 8,
    paddingBottom: 20,
  },
  mediaBox: {
    width: Dimensions.get("window").width / 3 - 22,
    height: 120,
    borderRadius: 20,
    marginHorizontal: 4,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  mediaThumb: {
    width: "100%",
    height: "100%",
  },
  loadingBox: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#007aff",
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 100,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
