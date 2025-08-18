import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiUrl, getUserEmail } from '../Api/ApiService';
import type { RootStackParamList } from '../index';

/** Route + Nav types */
type OrderTrackingParams = { orderId: string | number; code?: string };
type OrderTrackingRoute = RouteProp<{ OrderTracking: OrderTrackingParams }, 'OrderTracking'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

type OrderItem = {
  id: number | string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
};

type Address = {
  fullName?: string;
  phone?: string;
  line1?: string;
  ward?: string;
  district?: string;
  city?: string;
};

type Order = {
  id: number | string;
  code?: string;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
  shippingAddress?: Address;
  total: number;
  shippingFee?: number;
  note?: string;
  courier?: {
    name?: string;
    trackingNumber?: string;
  };
};

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Đặt hàng' },
  { key: 'CONFIRMED', label: 'Xác nhận' },
  { key: 'PACKED', label: 'Đóng gói' },
  { key: 'SHIPPING', label: 'Vận chuyển' },
  { key: 'DELIVERED', label: 'Giao thành công' },
];

function statusToIndex(s: OrderStatus): number {
  const idx = STEPS.findIndex((x) => x.key === s);
  return idx >= 0 ? idx : s === 'PENDING' ? 0 : -1;
}

function currency(v: number | undefined) {
  if (typeof v !== 'number') return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}

export default function OrderTrackingScreen() {
  const route = useRoute<OrderTrackingRoute>();
  const navigation = useNavigation<RootNav>();
  const { orderId, code } = route.params ?? { orderId: '' };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const progressIndex = useMemo(
    () => statusToIndex(order?.status ?? 'PENDING'),
    [order?.status]
  );

  /** Quay về trang chủ (reset stack) */
  const goHome = useCallback(() => {
    // Reset stack về màn 'Main' (HomeTab). Đổi thành 'Home' nếu muốn.
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    } as never);
  }, [navigation]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Thiếu orderId để tải đơn hàng.');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setLoading(true);

      const emailId = (await getUserEmail()) || '';
      if (!emailId) throw new Error('Chưa đăng nhập hoặc chưa lưu email.');

      const url = getApiUrl(`/public/users/${emailId}/orders/${orderId}`);

      const token =
        (await AsyncStorage.getItem('jwt-token')) ||
        (await AsyncStorage.getItem('accessToken')) ||
        (await AsyncStorage.getItem('token')) ||
        (await AsyncStorage.getItem('jwtToken'));

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const raw = res.data ?? {};
      const items: OrderItem[] = (raw.items ?? raw.orderItems ?? []).map((it: any) => {
        const p = it.product ?? {};
        const id = p.id ?? p.productId ?? it.productId ?? it.id;
        const name = p.name ?? it.productName ?? it.name ?? `SP #${id ?? ''}`;
        const image = p.image ?? p.imageUrl ?? it.image ?? it.thumbnail;
        const price = Number(it.price ?? it.unitPrice ?? p.price ?? 0);
        const quantity = Number(it.quantity ?? it.qty ?? 1);
        return { id, name, image, price, quantity };
      });

      const normalized: Order = {
        id: raw.id ?? raw.orderId ?? orderId,
        code: raw.code ?? raw.orderCode ?? code,
        status: ((raw.status ?? 'PLACED') as string).toUpperCase() as OrderStatus,
        createdAt: raw.createdAt ?? raw.created_date ?? raw.createdDate,
        updatedAt: raw.updatedAt ?? raw.updated_date ?? raw.updatedDate,
        items,
        shippingAddress:
          raw.shippingAddress ??
          raw.address ?? {
            fullName: raw.receiverName,
            phone: raw.receiverPhone,
            line1: raw.addressLine,
            ward: raw.ward,
            district: raw.district,
            city: raw.city,
          },
        total: Number(raw.total ?? raw.totalPrice ?? 0),
        shippingFee: Number(raw.shippingFee ?? raw.shipFee ?? 0),
        note: raw.note,
        courier: raw.courier ?? raw.shipping ?? undefined,
      };

      setOrder(normalized);
    } catch (e: any) {
      console.error('Load order failed', e?.response?.data ?? e?.message);
      setError(e?.response?.data?.message ?? e?.message ?? 'Không tải được đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [orderId, code]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, [fetchOrder]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchOrder}>
          <Text style={styles.buttonText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonOutline, { marginTop: 10 }]} onPress={goHome}>
          <Text style={[styles.buttonText, { color: '#0b6bcb' }]}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu đơn hàng.</Text>
        <TouchableOpacity style={[styles.button, styles.buttonOutline, { marginTop: 10 }]} onPress={goHome}>
          <Text style={[styles.buttonText, { color: '#0b6bcb' }]}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerTitle = order.code ? `#${order.code}` : `Đơn #${order.id}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Theo dõi đơn hàng</Text>
        <Text style={styles.sub}>{headerTitle}</Text>
        <View
          style={[
            styles.statusPill,
            order.status === 'CANCELLED'
              ? styles.pillDanger
              : order.status === 'DELIVERED'
              ? styles.pillSuccess
              : styles.pillInfo,
          ]}
        >
          <Text style={styles.pillText}>
            {order.status === 'PLACED' && 'Đã đặt'}
            {order.status === 'CONFIRMED' && 'Đã xác nhận'}
            {order.status === 'PACKED' && 'Đã đóng gói'}
            {order.status === 'SHIPPING' && 'Đang giao'}
            {order.status === 'DELIVERED' && 'Đã giao'}
            {order.status === 'PENDING' && 'Chờ xử lý'}
            {order.status === 'CANCELLED' && 'Đã huỷ'}
          </Text>
        </View>
        <Text style={styles.dateLine}>
          Tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
          {order.updatedAt ? `  ·  Cập nhật: ${new Date(order.updatedAt).toLocaleString('vi-VN')}` : ''}
        </Text>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tiến trình</Text>
        <View style={{ marginTop: 12 }}>
          {STEPS.map((s, i) => {
            const done = progressIndex >= i && order.status !== 'CANCELLED';
            const current = progressIndex === i && order.status !== 'CANCELLED';
            return (
              <View key={s.key} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepBullet,
                    done && styles.stepDone,
                    current && styles.stepCurrent,
                  ]}
                >
                  {done ? <Text style={styles.stepTick}>✓</Text> : null}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{s.label}</Text>
                  {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                </View>
              </View>
            );
          })}
          {order.status === 'CANCELLED' && (
            <View style={[styles.stepRow, { marginTop: 8 }]}>
              <View style={[styles.stepBullet, styles.stepDanger]}>
                <Text style={styles.stepTick}>×</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepLabel, { color: '#c62828' }]}>Đã huỷ</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sản phẩm</Text>
        {order.items?.length ? (
          order.items.map((it) => (
            <View key={String(it.id)} style={styles.itemRow}>
              <Image
                source={{ uri: it.image || 'https://via.placeholder.com/80x80.png?text=IMG' }}
                style={styles.itemImg}
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.itemName}>
                  {it.name}
                </Text>
                <Text style={styles.itemQty}>x{it.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{currency(it.price * it.quantity)}</Text>
            </View>
          ))
        ) : (
          <Text>Không có sản phẩm.</Text>
        )}
      </View>

      {/* Shipping Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
        <Text style={styles.addrLine}>
          {order.shippingAddress?.fullName ?? '—'} · {order.shippingAddress?.phone ?? '—'}
        </Text>
        <Text style={styles.addrLine}>
          {[
            order.shippingAddress?.line1,
            order.shippingAddress?.ward,
            order.shippingAddress?.district,
            order.shippingAddress?.city,
          ]
            .filter(Boolean)
            .join(', ') || '—'}
        </Text>
      </View>

      {/* Payment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thanh toán</Text>
        <View style={styles.sumRow}>
          <Text>Tạm tính</Text>
          <Text>
            {currency(order.items.reduce((s, it) => s + it.price * it.quantity, 0))}
          </Text>
        </View>
        <View style={styles.sumRow}>
          <Text>Phí vận chuyển</Text>
          <Text>{currency(order.shippingFee ?? 0)}</Text>
        </View>
        <View style={[styles.sumRow, { marginTop: 6 }]}>
          <Text style={styles.sumTotal}>Tổng cộng</Text>
          <Text style={styles.sumTotal}>{currency(order.total)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {!!order.courier?.trackingNumber && (
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => {
              Alert.alert(
                'Mã vận đơn',
                `${order.courier?.name ?? 'ĐVVC'}: ${order.courier?.trackingNumber}`
              );
            }}
          >
            <Text style={[styles.buttonText, { color: '#0b6bcb' }]}>Xem mã vận đơn</Text>
          </TouchableOpacity>
        )}

        {/* Nút về trang chủ */}
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={goHome}>
          <Text style={[styles.buttonText, { color: '#0b6bcb' }]}>Về trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onRefresh}>
          <Text style={styles.buttonText}>Làm mới</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  error: { color: '#c62828', textAlign: 'center', marginBottom: 12 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { marginTop: 2, color: '#555' },
  dateLine: { marginTop: 6, color: '#777' },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillInfo: { backgroundColor: '#e3f2fd' },
  pillSuccess: { backgroundColor: '#e8f5e9' },
  pillDanger: { backgroundColor: '#ffebee' },
  pillText: { color: '#0b6bcb', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#90caf9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#fff',
  },
  stepDone: { backgroundColor: '#0b6bcb', borderColor: '#0b6bcb' },
  stepCurrent: { borderColor: '#0b6bcb' },
  stepDanger: { backgroundColor: '#c62828', borderColor: '#c62828' },
  stepTick: { color: '#fff', fontWeight: '700' },
  stepContent: { flex: 1 },
  stepLabel: { fontSize: 14, color: '#333' },
  stepLabelDone: { color: '#0b6bcb', fontWeight: '600' },
  stepLine: {
    height: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    marginLeft: 11,
    marginTop: 2,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  itemImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
  itemName: { fontWeight: '600' },
  itemQty: { marginTop: 4, color: '#777' },
  itemPrice: { fontWeight: '700' },
  addrLine: { marginTop: 8, color: '#444' },
  sumRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  sumTotal: { fontWeight: '700', fontSize: 16 },
  button: {
    backgroundColor: '#0b6bcb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutline: { backgroundColor: '#e3f2fd' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
