import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getUserEmail, listUserOrders, } from '../Api/ApiService';
import type { RootStackParamList } from '../index';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

type Order = {
  id?: number | string;
  orderId?: number | string;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  amount?: number;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  createdDate?: string;
};

const fmtVND = (n: any) => {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return `${(Number.isFinite(v) ? v : 0).toLocaleString('vi-VN')} ₫`;
};

export default function OrdersScreen({ navigation }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      const e = email ?? (await getUserEmail());
      if (e) setEmail(e);
      if (!e) { setData([]); return; }
      const list = await listUserOrders(e);
      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []); // eslint-disable-line

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const goDetail = (o: Order) => {
    // Tuỳ app: nếu có OrdersDetail/OrderTracking theo orderId
    const oid = String(o.orderId ?? o.id ?? '');
    if (!oid) return;
    navigation.navigate('OrderTracking' as any, { orderId: oid } as any);
  };

  const renderItem = ({ item }: { item: Order }) => {
    const id = String(item.orderId ?? item.id ?? '');
    const stt = item.orderStatus ?? item.status ?? '(chưa rõ)';
    const pay = item.paymentStatus ?? '';
    const total = item.totalAmount ?? item.total ?? item.amount ?? 0;
    const created = item.createdAt ?? item.createdDate ?? '';

    return (
      <TouchableOpacity style={s.card} onPress={() => goDetail(item)} activeOpacity={0.8}>
        <View style={s.rowBetween}>
          <Text style={s.title}>Đơn #{id || '—'}</Text>
          <Text style={s.badge}>{stt}</Text>
        </View>
        {!!pay && <Text style={s.muted}>Thanh toán: {pay}</Text>}
        <Text style={s.muted}>Tổng tiền: {fmtVND(total)}</Text>
        {!!created && <Text style={s.muted}>Tạo lúc: {created}</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Đang tải…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {data.length === 0 ? (
        <View style={s.center}>
          <Text style={{ color: '#6b7280' }}>Bạn chưa có đơn hàng nào.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700' },
  badge: { backgroundColor: '#111827', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  muted: { color: '#6b7280', marginTop: 4 },
});
