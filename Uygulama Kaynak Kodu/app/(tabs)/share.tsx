import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { createThumbnail } from "react-native-create-thumbnail";
import { useGlobalSearchParams } from "expo-router";
import { SERVER_ADDRESS } from "../index";

const ShareScreen = () => {
  const { username } = useGlobalSearchParams<{ username: string }>();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<any>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickMedia = async () => {
    const result = await launchImageLibrary({ mediaType: "mixed" });

    if (result?.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const type = asset.type?.startsWith("video") ? "video" : "image";

      setMedia(asset);
      setMediaType(type);

      if (type === "video") {
        const thumb = await createThumbnail({ url: asset.uri! });
        setThumbnail(thumb.path);
      } else {
        setThumbnail(asset.uri!);
      }
    }
  };

  const takePhoto = async () => {
    const result = await launchCamera({ mediaType: "photo" });

    if (result?.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia(asset);
      setMediaType("image");
      setThumbnail(asset.uri!);
    }
  };

  const takeVideo = async () => {
    const result = await launchCamera({ mediaType: "video" });

    if (result?.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia(asset);
      setMediaType("video");
      setThumbnail(asset.uri!);
    }
  };

  const sharePost = async () => {
    if (!text.trim() || !media) {
      Alert.alert("Hata", "Lütfen açıklama gir ve bir medya seç.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("text", text);
    formData.append("type", mediaType!);
    formData.append("media", {
      uri: media.uri,
      name: media.fileName || `upload.${mediaType === "image" ? "jpg" : "mp4"}`,
      type: media.type,
    } as any);

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_ADDRESS}/share`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Gönderi paylaşıldı.");
        setText("");
        setMedia(null);
        setMediaType(null);
        setThumbnail(null);
      } else {
        const error = await response.json();
        Alert.alert("Hata", error?.detail || "Bir sorun oluştu.");
      }
    } catch (e) {
      Alert.alert("Hata", "Sunucuya bağlanırken sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ne söylemek istersin?"
        style={styles.input}
        multiline
      />

      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
      ) : (
        <Text style={styles.noMedia}>Fotoğraf veya video yok.</Text>
      )}

      <TouchableOpacity onPress={pickMedia} style={styles.button}>
        <Text style={styles.buttonText}>Galeriden Seç</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={takePhoto} style={styles.button}>
        <Text style={styles.buttonText}>Kamera ile Fotoğraf Çek</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={takeVideo} style={styles.button}>
        <Text style={styles.buttonText}>Kamera ile Video Çek</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={sharePost}
        style={[styles.button]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Paylaş</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ShareScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 15,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  noMedia: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  button: {
    padding: 15,
    backgroundColor: "#1E88E5",
    borderRadius: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});