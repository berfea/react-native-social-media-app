import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SERVER_ADDRESS } from "./index";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Hata", "Lütfen geçerli bir kullanıcı adı ve şifre girin.", [{ text: "Tamam" }]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(SERVER_ADDRESS + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        router.replace({ pathname: "/feed", params: { username: username } });
      } else {
        Alert.alert("Hata", data.detail || "Giriş başarısız. Bir hata oluştu.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Hata", "Bağlantı hatası. Lütfen daha sonra tekrar deneyin.");
    }
  };

  return (
    <View style={styles.viewStyle}>
      <Image source={require("../assets/images/login_logo.png")} style={styles.logo} />
      <Text style={styles.title}>Mirror'a Giriş Yap</Text>
      <TextInput
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        style={styles.textbox}
      />
      <TextInput
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.textbox}
      />
      <TouchableOpacity onPress={() => router.push("/forgot")} style={styles.secondarybutton}>
        <Text style={styles.secondarybuttontitle}>Şifremi Unuttum</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/signup")} style={styles.secondarybutton}>
        <Text style={styles.secondarybuttontitle}>Hesap Oluştur</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogin} style={styles.primarybutton}>
        <Text style={styles.primarybuttontitle}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Text>
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
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
    resizeMode: "contain",
  },
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
  secondarybutton: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#0090ff",
  },
  primarybuttontitle: {
    fontSize: 19,
    color: "white",
    fontWeight: "bold",
  },
  secondarybuttontitle: {
    fontSize: 18,
    color: "#0090ff",
    fontWeight: "bold",
  },
});
