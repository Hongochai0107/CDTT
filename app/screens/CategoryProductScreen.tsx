// screens/CategoryProductScreen.tsx
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { GET_ALL } from '../Api/ApiService'; // gọi API theo categoryId
import { RootStackParamList } from '../index';

type CategoryProductRouteProp = RouteProp<RootStackParamList, 'CategoryProduct'>;

export default function CategoryProductScreen() {
  const route = useRoute<CategoryProductRouteProp>();
  const { categoryId, categoryName } = route.params;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        const response = await GET_ALL(`public/categories/${categoryId}/products`);
        const data = response.data.content ?? response.data;
        setProducts(data);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [categoryId]);

  const getImageUrl = (image: string) =>
    `http://localhost:8080/api/public/products/image/${image}`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName}</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.productId.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.image} />
            <Text style={styles.name}>{item.productName}</Text>
            <Text style={styles.price}>{item.price.toLocaleString()} ₫</Text>
          </View>
        )}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    padding: 10,
    marginBottom: 16,
  },
  image: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '500', color: '#333' },
  price: { fontSize: 14, fontWeight: 'bold', color: '#e53935' },
});
