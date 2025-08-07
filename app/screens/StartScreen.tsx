import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../index';

const StartScreen = () => {
  type StartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Start'>;
const navigation = useNavigation<StartScreenNavigationProp>();


  return (
    <View style={styles.container}>
      {/* Logo giữa */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* Tên app */}
      <Text style={styles.title}>Shoppe</Text>
      <Text style={styles.subtitle}>Beautiful eCommerce UI Kit{'\n'}for your online store</Text>

      {/* Nút chính */}
      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={() => navigation.navigate('Main')}
        >
        <Text style={styles.buttonText}>Let's get started</Text>
      </TouchableOpacity>

      {/* Link đăng nhập */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>
          I already have an account <Text style={styles.arrow}> → </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#444',
  },
  arrow: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 5,
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: '#007BFF',
    borderRadius: 15,
    fontWeight: 'bold',
    textAlignVertical: 'center',
  },
});

export default StartScreen;
