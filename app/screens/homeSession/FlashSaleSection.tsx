// FlashSaleSection.tsx

import { getFlashSaleProducts } from '@/app/Api/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../..';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const FlashSaleSection = () => {
  const navigation = useNavigation<NavigationProp>();
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const products = await getFlashSaleProducts();
        setFlashSales(products);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm flash sale:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSales();
  }, []);

  const handlePress = (product: any) => {
    navigation.navigate('ProductDetail', { productId: product.productId });
  };

  const getImageUrl = (imageName: string) => {
    return imageName
      ? `http://localhost:8080/api/public/products/image/${imageName}`
      : 'https://via.placeholder.com/170x170';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Flash Sale</Text>
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={16} color="#007bff" />
          <Text style={styles.timerText}>00</Text>
          <Text style={styles.timerText}>36</Text>
          <Text style={styles.timerText}>58</Text>
        </View>
      </View>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={flashSales}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress(item)}>
              <View style={styles.card}>
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.image}
                  defaultSource={require('../../../assets/images/default_image.png')}
                />
                <View style={styles.discountTag}>
                  <Text style={styles.discountText}>
                    {item.discount && item.discount > 0
                      ? `-${item.discount}%`
                      : item.specialPrice && item.price && item.specialPrice < item.price
                      ? `-${Math.round(100 - (item.specialPrice / item.price) * 100)}%`
                      : ''}
                  </Text>
                </View>
                <View style={{ padding: 6 }}>
                  <Text numberOfLines={1} style={{ fontWeight: 'bold', fontSize: 13 }}>{item.name}</Text>
                  <Text style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: 13 }}>
                    {item.specialPrice && item.specialPrice > 0 ? `${item.specialPrice.toLocaleString()}₫` : `${item.price?.toLocaleString()}₫`}
                  </Text>
                  {item.specialPrice && item.specialPrice > 0 && (
                    <Text style={{ color: '#888', textDecorationLine: 'line-through', fontSize: 11 }}>
                      {item.price?.toLocaleString()}₫
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          numColumns={3}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardSize = (width - 60) / 3;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: cardSize,
    height: cardSize,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default FlashSaleSection;
