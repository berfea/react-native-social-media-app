import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, ActivityIndicator, Alert, StatusBar } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { SERVER_ADDRESS } from "../index";
import * as Icons from "@expo/vector-icons";

interface Post {
  text: string;
  mediaPath: string;
  likes: string[];
  comments: [string, string][];
  username: string;
}

const Feed = () => {
  const { username } = useGlobalSearchParams<{ username: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchData(currentPage);
  }, []);

  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_ADDRESS}/feed/images/${page}`);
      if (response.ok) {
        const data = await response.json();
        setPosts((prevPosts) => [...prevPosts, ...data]);
      } else {
        Alert.alert("Hata", "Veriler alınırken hata oluştu.");
      }
    } catch (error) {
      Alert.alert("Hata", "Sunucuya bağlanırken sorun yaşandı.");
    }
    setIsLoading(false);
  };

  const loadMore = () => {
    if (!isLoading) {
      const newPage = currentPage + 5;
      setCurrentPage(newPage);
      fetchData(newPage);
    }
  };

  const likePost = async (mediaPath: string) => {
    try {
      const response = await fetch(`${SERVER_ADDRESS}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, mediaPath }),
      });
      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.mediaPath === mediaPath) {
              let newLikes = [...post.likes];
              if (newLikes.includes(username)) {
                newLikes = newLikes.filter((likeUser) => likeUser !== username);
              } else {
                newLikes.push(username);
              }
              return { ...post, likes: newLikes };
            }
            return post;
          })
        );
      } else {
        Alert.alert("Hata", "Beğeni işlemi sırasında sorun oluştu.");
      }
    } catch (error) {
      Alert.alert("Hata", "Beğeni işlemi sırasında bağlantı hatası.");
    }
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const closeComments = () => {
    setSelectedPost(null);
    setCommentModalVisible(false);
    setNewComment("");
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const payload = {
        mediaPath: selectedPost.mediaPath,
        comment: [username, newComment] as [string, string],
      };
      const response = await fetch(`${SERVER_ADDRESS}/add-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.mediaPath === selectedPost.mediaPath) {
              const updatedComments: [string, string][] = [...post.comments, [username, newComment]];
              return { ...post, comments: updatedComments };
            }
            return post;
          })
        );
        setSelectedPost((prev) => (prev ? { ...prev, comments: [...prev.comments, [username, newComment] as [string, string]] } : prev));
        setNewComment("");
      } else {
        Alert.alert("Hata", "Yorum eklenemedi.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı hatası.");
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes.includes(username);
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Image source={require("../../assets/images/default.jpg")} style={styles.profilePic} />
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <TouchableOpacity>
          <Image source={{ uri: `${SERVER_ADDRESS}/file/${item.mediaPath}` }} style={styles.postImage} />
        </TouchableOpacity>
        <View style={styles.postFooter}>
          <Text style={styles.caption}>{item.text}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => openComments(item)} style={styles.actionButton}>
              <Text style={styles.actionText}>{item.comments.length}</Text>
              <Icons.FontAwesome name="comment-o" size={24} color="gray" style={{ marginHorizontal: 6 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => likePost(item.mediaPath)} style={styles.actionButton}>
              <Text style={styles.actionText}>{item.likes.length}</Text>
              <Icons.FontAwesome name={isLiked ? "heart" : "heart-o"} size={24} color={isLiked ? "red" : "gray"} style={{ marginHorizontal: 6, marginTop: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={commentModalVisible ? "rgba(0,0,0,0.5)" : "rgb(255,255,255)"} animated />
      {posts.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>İçerik yok. Henüz paylaşım yapılmamış.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.mediaPath}
          renderItem={renderPost}
          onEndReached={loadMore}
          onEndReachedThreshold={0.7}
          ListFooterComponent={isLoading ? <ActivityIndicator size="large" color="#0090ff" /> : null}
        />
      )}

      <Modal visible={commentModalVisible} animationType="fade" transparent onRequestClose={closeComments}>
        <View style={styles.modalOverlay} />
      </Modal>

      <Modal visible={commentModalVisible} animationType="slide" transparent onRequestClose={closeComments}>
        <View style={styles.modalOverlayFlexer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yorumlar</Text>
            {selectedPost && selectedPost.comments.length > 0 ? (
              <FlatList
                data={selectedPost.comments}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text style={styles.commentItem}>
                    {item[0]}: {item[1]}
                  </Text>
                )}
              />
            ) : (
              <Text style={styles.emptyCommentText}>Henüz yorum yok.</Text>
            )}
            <View style={styles.commentInputContainer}>
              <TextInput style={styles.commentInput} placeholder="Yorum yaz..." value={newComment} onChangeText={setNewComment} />
              <TouchableOpacity onPress={submitComment} style={styles.sendButton}>
                <Text style={styles.sendButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={closeComments} style={styles.closeModalButton}>
              <Text style={styles.closeModalText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    color: "gray",
  },
  postContainer: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0090ff",
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0090ff",
  },
  postImage: {
    width: "100%",
    height: 500,
    backgroundColor: "#ccc",
    objectFit: "cover",
  },
  postFooter: {
    flexDirection: "row",
    flex: 1,
    padding: 10,
  },
  caption: {
    fontSize: 16,
    marginBottom: 8,
    flex: 0.7,
  },
  actionsContainer: {
    flex: 0.3,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  actionText: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  actionIcon: {
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayFlexer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.0)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 16,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  commentItem: {
    fontSize: 18,
    marginVertical: 4,
    marginHorizontal: 6,
  },
  emptyCommentText: {
    fontSize: 18,
    color: "gray",
    textAlign: "center",
    marginVertical: 12,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#0090ff",
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeModalButton: {
    alignSelf: "center",
    marginTop: 8,
  },
  closeModalText: {
    fontSize: 18,
    color: "#0090ff",
  },
});

export default Feed;