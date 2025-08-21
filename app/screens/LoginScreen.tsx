import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginUser, saveUserEmail } from '../Api/ApiService';
import { RootStackParamList } from '../index';


const LoginScreen = () => {
  type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      const user = await loginUser(email, password);
      await saveUserEmail(email);
      Alert.alert('Thành công', `Chào mừng ${user.email}!`);
      navigation.navigate('Onboarding');
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', 'Tài khoản hoặc mật khẩu không đúng.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Bubbles.png')}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Good to see you back! <Text style={{ fontSize: 16 }}>❤️</Text>
          </Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.nextButton} onPress={handleLogin}>
            <Text style={styles.nextButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={{ color: "#0d6efd", textAlign: "center", marginTop: 10 }}>
              Quên mật khẩu?
            </Text>
          </TouchableOpacity>


          {/* --- Nút Google Sign-In --- */}
          {/* <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#DB4437' }]}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Text style={styles.nextButtonText}>Continue with Google</Text>
          </TouchableOpacity> */}

          <TouchableOpacity>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    marginTop: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#e9e9e9',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default LoginScreen;
