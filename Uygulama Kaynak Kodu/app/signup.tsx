import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SERVER_ADDRESS } from "./index";

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
  const [emailAvailable, setEmailAvailable] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);

  const checkUsername = async (text: string) => {
    setUsername(text);
    if (text.length < 3) return setUsernameAvailable(null);
    const response = await fetch(SERVER_ADDRESS + "/check-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: text }),
    });
    const data = await response.json();
    setUsernameAvailable(data.available);
  };

  const checkEmail = async (text: string) => {
    setEmail(text);
    if (!text.includes("@")) return setEmailAvailable(null);
    const response = await fetch(SERVER_ADDRESS + "/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: text }),
    });
    const data = await response.json();
    setEmailAvailable(data.available);
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    if (!usernameAvailable) {
      Alert.alert("Hata", "Bu kullanıcı adı zaten alınmış.");
      return;
    }
    if (!emailAvailable) {
      Alert.alert("Hata", "Bu e-posta zaten kullanılıyor.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Hata", "Şifre en az 8 karakter uzunluğunda olmalı.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler uyuşmuyor.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(SERVER_ADDRESS + "/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        Alert.alert("Başarılı", "Kayıt işlemi tamamlandı.", [{ text: "Tamam", onPress: () => router.replace("/login") }]);
      } else {
        Alert.alert("Hata", data.detail || "Kayıt başarısız.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Hata", "Bağlantı hatası. Lütfen daha sonra tekrar deneyin.");
    }
  };

  return (
    <View style={styles.viewStyle}>
      <Image source={require("../assets/images/login_logo.png")} style={styles.logo} />
      <Text style={styles.title}>Mirror'a Katıl</Text>
      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={checkUsername}
        style={usernameAvailable == null ? styles.textbox : usernameAvailable ? styles.textboxsuccess : styles.textboxerror}
      />
      <TextInput placeholder="E-posta" value={email} onChangeText={checkEmail} style={emailAvailable == null ? styles.textbox : emailAvailable ? styles.textboxsuccess : styles.textboxerror} />
      <TextInput placeholder="Şifre" value={password} onChangeText={setPassword} secureTextEntry style={styles.textbox} />
      <TextInput placeholder="Şifre Tekrar" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.textbox} />
      <TouchableOpacity onPress={handleSignup} style={styles.primarybutton}>
        <Text style={styles.primarybuttontitle}>{loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  viewStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  logo: { width: 200, height: 200, marginBottom: 10, resizeMode: "contain" },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#0090ff",
  },
  textbox: {
    fontSize: 18,
    width: "100%",
    height: 50,
    paddingLeft: 20,
    borderWidth: 1,
    margin: 7,
    borderRadius: 50,
  },
  textboxsuccess: {
    fontSize: 18,
    width: "100%",
    height: 50,
    paddingLeft: 20,
    borderWidth: 2,
    margin: 7,
    borderRadius: 50,
    borderColor: "#00c000",
  },
  textboxerror: {
    fontSize: 18,
    width: "100%",
    height: 50,
    paddingLeft: 20,
    borderWidth: 2,
    margin: 7,
    borderRadius: 50,
    borderColor: "red",
  },
  primarybuttontitle: { fontSize: 19, color: "white", fontWeight: "bold" },
  primarybutton: {
    backgroundColor: "#0090ff",
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#0080ff",
  },
});
