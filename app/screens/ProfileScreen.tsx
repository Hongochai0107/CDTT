import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { clearAuthHeader, getUserProfile } from '../Api/ApiService';
import type { RootStackParamList } from '../index';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserProfile();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // GUARD: nếu không có token thì đá ra Login ngay khi screen lấy focus
  // useFocusEffect(
  //   useCallback(() => {
  //     let mounted = true;
  //     (async () => {
  //       const token = await AsyncStorage.getItem('jwt-token');
  //       if (mounted && !token) {
  //         const rootNav = navigation.getParent?.() ?? navigation;
  //         rootNav.dispatch(
  //           CommonActions.reset({ index: 0, routes: [{ name: 'Login' as never }] }),
  //         );
  //       }
  //     })();
  //     return () => { mounted = false; };
  //   }, [navigation])
  // );

  const handleLogout = async () => {
    if (loggingOut) return;

    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);

            // 1) Xóa toàn bộ key từ AsyncStorage
            const keysToRemove = [
              'jwt-token',
              'refresh-token',
              'access_token',
              'user-email',
              'user-info',
              'cart-id',
              'cart',
              'wishlist',
            ];
            await AsyncStorage.multiRemove(keysToRemove);
            // Xác nhận xóa thành công
            const remainingKeys = await AsyncStorage.getAllKeys();
            if (keysToRemove.some(key => remainingKeys.includes(key))) {
              throw new Error('Một số dữ liệu phiên không được xóa');
            }

            // 2) Xóa header Authorization từ axios
            if (clearAuthHeader) {
              clearAuthHeader();
            }
            delete axios.defaults.headers.common.Authorization;
            // Xác nhận header đã được xóa
            if (axios.defaults.headers.common.Authorization) {
              console.warn('Header Authorization vẫn tồn tại sau khi xóa');
            }

            // 3) Reset navigation stack
            const rootNav = navigation.getParent?.() ?? navigation;
            rootNav.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              })
            );
          } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại sau.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const goAddressBook = () => {
    navigation.navigate('Address', { mode: 'manage' } as never);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image source={require('../../assets/images/avt.jpg')} style={styles.avatar} />
        <Text style={styles.name}>
          {((user?.firstName || '') + ' ' + (user?.lastName || '')).trim() || 'Chưa có tên'}
        </Text>
        <Text style={styles.email}>{user?.email || 'Chưa có email'}</Text>
        <Text style={styles.phone}>{user?.mobileNumber || 'Chưa có số điện thoại'}</Text>
      </View>

      {/* Quản lý đơn hàng */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quản lý đơn hàng</Text>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Orders' as never)}
        >
          <Text style={styles.optionText}>Xem đơn hàng mua</Text>
        </TouchableOpacity>

        {/* Sổ địa chỉ */}
        <TouchableOpacity style={styles.optionButton} onPress={goAddressBook}>
          <Text style={styles.optionText}>Sổ địa chỉ</Text>
        </TouchableOpacity>
      </View>

      {/* Quản lý bán hàng */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quản lý bán hàng</Text>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Sản phẩm đăng bán</Text>
        </TouchableOpacity>
      </View>

      {/* Khác */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Khác</Text>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Sản phẩm yêu thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Hỗ trợ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Cài đặt</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng xuất</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  profileContainer: { alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  email: { fontSize: 16, color: '#666', marginBottom: 3 },
  phone: { fontSize: 16, color: '#666' },
  sectionContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginTop: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  optionButton: { paddingVertical: 10 },
  optionText: { fontSize: 16, color: '#007bff' },
  logoutButton: { backgroundColor: '#dc3545', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;