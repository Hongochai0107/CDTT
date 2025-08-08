import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllProducts } from '../../Api/ApiService';
import { RootStackParamList } from '../../index';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const JustForYouSection = () => {
  const navigation = useNavigation<NavigationProp>();
  const [productsCol1, setProductsCol1] = useState<any[]>([]);
  const [productsCol2, setProductsCol2] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();

        const col1: any[] = [];
        const col2: any[] = [];

        data.forEach((item: any, index: number) => {
          (index % 2 === 0 ? col1 : col2).push(item);
        });

        setProductsCol1(col1);
        setProductsCol2(col2);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePress = (product: any) => {
    navigation.navigate('ProductDetail', { productId: product.productId });
  };

  const getImageUrl = (imageName: string) => {
    return imageName
      ? `http://localhost:8080/api/public/products/image/${imageName}`
      : 'https://via.placeholder.com/170x170';
  };

  if (loading) {
    return (
      <View style={{ marginTop: 20 }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Just For You</Text>
        <Text style={styles.star}>★</Text>
      </View>

      <View style={styles.productGrid}>
        {/* Column 1 */}
        <View style={styles.column}>
          {productsCol1.map((item) => (
            <TouchableOpacity
              activeOpacity={0.8}
              key={item.id}
              onPress={() => handlePress(item)}
              style={styles.productCardGrid}
            >
              <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.productPrice}>
                {item.price.toLocaleString()} ₫
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Column 2 */}
        <View style={[styles.column, { marginTop: 30 }]}>
          {productsCol2.map((item) => (
            <TouchableOpacity
              activeOpacity={0.8}
              key={item.id}
              onPress={() => handlePress(item)}
              style={styles.productCardGrid}
            >
              <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.productPrice}>
                {item.price.toLocaleString()} ₫
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  star: {
    marginLeft: 6,
    fontSize: 18,
    color: '#007bff',
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  productCardGrid: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productName: {
    fontWeight: '500',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 8,
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    color: '#e53935',
  },
});

export default JustForYouSection;
