import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SERVER_ADDRESS } from "./index";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setVerificationCode] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendVerificationCode = async () => {
    if (!email.includes("@")) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_ADDRESS}/send-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        Alert.alert("Başarılı", "Doğrulama kodu e-posta adresinize gönderildi.");
        setIsCodeSent(true);
      } else {
        Alert.alert("Hata", data.detail || "Kod gönderilemedi.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Hata", "Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  const resetPassword = async () => {
    if (!code || !new_password || !confirmNewPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    if (new_password.length < 8) {
      Alert.alert("Hata", "Şifre en az 8 karakter uzunluğunda olmalı.");
      return;
    }
    if (new_password !== confirmNewPassword) {
      Alert.alert("Hata", "Şifreler uyuşmuyor.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_ADDRESS}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        Alert.alert("Başarılı", "Şifreniz başarıyla yenilendi.", [{ text: "Tamam", onPress: () => router.replace("/login") }]);
      } else {
        Alert.alert("Hata", data.detail || "Şifre yenileme başarısız.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Hata", "Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  return (
    <View style={styles.viewStyle}>
      <Image source={require("../assets/images/login_logo.png")} style={styles.logo} />
      <Text style={styles.title}>Mirror Şifreni Yenile</Text>
      <TextInput placeholder="E-posta" value={email} onChangeText={setEmail} style={styles.textbox} editable={!isCodeSent} />
      <TextInput placeholder="Yeni Şifre" value={new_password} onChangeText={setNewPassword} secureTextEntry style={styles.textbox} />
      <TextInput placeholder="Yeni Şifre Tekrar" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry style={styles.textbox} />
      <TextInput placeholder="Doğrulama Kodu" value={code} onChangeText={setVerificationCode} style={styles.textbox} />
      <TouchableOpacity onPress={isCodeSent ? resetPassword : sendVerificationCode} style={styles.primarybutton}>
        <Text style={styles.primarybuttontitle}>{loading ? "İşlem yapılıyor..." : isCodeSent ? "Şifreyi Yenile" : "Doğrulama Kodu Gönder"}</Text>
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
