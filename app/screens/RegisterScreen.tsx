// RegisterScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registerUser, type RegisterUserData } from '../Api/ApiService';
import type { RootStackParamList } from '../index';

const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

  // Nếu người dùng không nhập first/last name, tách từ email/phone để điền tạm
  const ensureNames = () => {
    let f = (firstName || '').trim();
    let l = (lastName  || '').trim();

    if (!f && !l) {
      const base = (email || phone || 'user').split('@')[0].replace(/\W+/g, ' ').trim() || 'user';
      const parts = base.split(' ').filter(Boolean);
      f = parts[0] || 'user';
      l = parts.slice(1).join(' ') || f;
    }

    // Fit độ dài “an toàn”
    const fit = (s: string) => {
      let t = s.trim();
      if (t.length < 2) t = (t + '_____').slice(0, 2);
      if (t.length > 30) t = t.slice(0, 30);
      return t;
    };
    return { first: fit(f), last: fit(l) };
  };

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin và xác nhận mật khẩu.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    const { first, last } = ensureNames();

    // Khớp kiểu RegisterUserData theo APIService.tsx
    const payload: RegisterUserData = {
      userId: 0, // server có thể bỏ qua
      firstName: first,
      lastName : last,
      mobileNumber: (phone || '0123456789').trim(),
      email: email.trim(),
      password: password.trim(),
      roles: [{ roleId: 102, roleName: 'USER' }], // role mặc định
      address: {
        addressId: 0,
        street: 'Default Street',
        buildingName: 'Building 1001',
        city: 'Ho Chi Minh',
        state: 'HCM',
        country: 'VN',
        pincode: '700000',
      },
    };

    setLoading(true);
    try {
      console.log('[Register] Click SignUp ->', { email, phone });

      // APIService.registerUser sẽ tự lưu token + email nếu server trả về
      const ok = await registerUser(payload); // <-- ĐÚNG CHỮ KÝ MỚI

      if (ok) {
        Alert.alert('Thành công', 'Đăng ký & đăng nhập thành công!');
        navigation.navigate('Onboarding' as never);
      } else {
        Alert.alert('Đăng ký thất bại', 'Email có thể đã tồn tại hoặc dữ liệu không hợp lệ.');
      }
    } catch (e: any) {
      console.warn('[Register] Error:', e?.response?.status, e?.response?.data || e?.message);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Không thể đăng ký. Vui lòng thử lại.';
      Alert.alert('Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Bubbles.png')}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Đăng ký tài khoản mới</Text>

          <View style={{ flexDirection: 'column', gap: 12 }}>
            <TextInput
              placeholder="First name"
              placeholderTextColor="#aaa"
              style={[styles.input, { flex: 1 }]}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              placeholder="Last name"
              placeholderTextColor="#aaa"
              style={[styles.input, { flex: 1 }]}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Phone (optional)"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.nextButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>Sign up</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.cancelText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, marginTop: 80 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 16 },
  input: {
    backgroundColor: '#efefef', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 18,
    fontSize: 16, marginBottom: 14,
  },
  nextButton: {
    backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelText: { color: '#007BFF', textAlign: 'center', fontSize: 14 },
});

export default RegisterScreen;
