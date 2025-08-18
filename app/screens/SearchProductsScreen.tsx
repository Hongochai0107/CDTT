// screens/SearchProductsScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { RootStackParamList } from '../index';

import { GET_ALL, imgUrl } from '../Api/ApiService';
import { useDebounce } from '../hooks/useDebounce';
import SearchBar from '../screens/components/SearchBar';

type Product = {
  productId: number | string;
  productName: string;
  price: number;
  image?: string;
};

export default function SearchProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);

  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resolveImage = (raw?: string) => {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    return imgUrl(raw);
  };

  const fetchSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setData([]); setError(null); return; }
    setLoading(true); setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await GET_ALL(`public/products/keyword/${encodeURIComponent(q.trim())}`);
      const rawList = Array.isArray(res.data) ? res.data : res.data?.content ?? res.data?.items ?? [];

      if (__DEV__) {
        console.log('[Search] keyword =', q);
        console.log('[Search] total =', Array.isArray(rawList) ? rawList.length : 0);
        console.log('[Search] sample item =', rawList?.[0]);
      }

      setData(rawList as Product[]);
    } catch (e: any) {
      setError(e?.message || 'Lỗi tìm kiếm');
      if (__DEV__) console.warn('[Search] error:', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSearch(debounced); }, [debounced, fetchSearch]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        onSubmit={() => { Keyboard.dismiss(); fetchSearch(query); }}
        placeholder="Tìm kiếm sản phẩm..."
      />

      {loading && <ActivityIndicator style={{ marginVertical: 12 }} />}
      {!!error && <Text style={{ color: 'tomato' }}>{error}</Text>}
      {!loading && !error && query.trim() && data.length === 0 && <Text>Không tìm thấy kết quả.</Text>}
      {!loading && !error && !query.trim() && <Text>Nhập từ khóa để bắt đầu tìm kiếm.</Text>}

      <FlatList
        data={data}
        keyExtractor={(it) => String((it as Product).productId)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const p = item as Product;
          const uri = resolveImage(p.image);

          const goDetail = () => {
            // đảm bảo truyền đúng number theo RootStackParamList
            const pid = Number(p.productId);
            if (!Number.isNaN(pid)) {
              navigation.navigate('ProductDetail', { productId: pid });
            } else {
              if (__DEV__) console.warn('productId invalid:', p.productId);
            }
          };

          return (
            <TouchableOpacity
              onPress={goDetail}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 10 }}
            >
              {uri ? (
                <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              ) : (
                <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: '#eee' }} />
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }} numberOfLines={2}>
                  {p.productName || '(Không có tên)'}
                </Text>
                <Text>{Number(p.price).toLocaleString('vi-VN')} ₫</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
