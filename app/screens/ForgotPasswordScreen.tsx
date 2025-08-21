import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { forgotPassword } from "../Api/ApiService";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email.");
      return;
    }
    // kiểm tra định dạng cơ bản
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập email đúng định dạng.");
      return;
    }

    try {
      setLoading(true);
      const message = await forgotPassword(trimmed);
      Alert.alert("Thành công", message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Thất bại", e?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập email tài khoản. Hệ thống sẽ gửi mật khẩu mới vào email của bạn.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Gửi</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0d6efd", paddingVertical: 14, borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#0d6efd" },
});
