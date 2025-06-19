import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import Video from "react-native-video";
import { Ionicons } from "@expo/vector-icons";
import { SERVER_ADDRESS } from "../index";
import { useGlobalSearchParams } from "expo-router";

const height = Dimensions.get("window").height - 185;

const Explore = () => {
  const {username} = useGlobalSearchParams<{ username: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  interface Video {
    mediaPath: string;
    username: string;
    text: string;
    likes: string[];
  }

  const videoRefs = useRef([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_ADDRESS}/explore/videos`);
      const data = await response.json();
      setVideos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const likePost = async (mediaPath: string) => {
    try {
      await fetch(`${SERVER_ADDRESS}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, mediaPath }),
      });

      setVideos((prev) =>
        prev.map((v) =>
          v.mediaPath === mediaPath
            ? {
                ...v,
                likes: v.likes.includes(username)
                  ? v.likes.filter((u) => u !== username)
                  : [...v.likes, username],
              }
            : v
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item, index }: { item: Video; index: number }) => {
    return (
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: `${SERVER_ADDRESS}/file/${item.mediaPath}` }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
          paused={currentIndex !== index}
        />
        <View style={styles.overlay}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.description}>{item.text}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => likePost(item.mediaPath)}>
              <Ionicons
                name={
                  item.likes.includes(username)
                    ? "heart"
                    : "heart-outline"
                }
                size={32}
                color="white"
              />
            </TouchableOpacity>
            <Text style={styles.likes}>{item.likes.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.mediaPath}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / height);
        if (index < videos.length) {
          setCurrentIndex(index);
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    height: height,
    width: "100%",
    backgroundColor: "black",
  },
  overlay: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 16,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  description: {
    color: "white",
    marginTop: 4,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  likes: {
    color: "white",
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
});

export default Explore;
