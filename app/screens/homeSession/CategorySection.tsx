import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../..';
import { GET_ALL, getAllCategoriesWithProducts } from '../../Api/ApiService';

type Category = {
  categoryId: number;
  categoryName: string;
  productCount?: number;
  products?: Array<{
    productId: number;
    productName: string;
    image: string;
    specialPrice?: number;
  }>;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategoriesWithProducts();
        setCategories(data);
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

const handleSeeAll = async (categoryId: number, categoryName: string) => {
  try {
    const response = await GET_ALL(`public/categories/${categoryId}/products`);
    const products = response.data.content ?? response.data;

    navigation.navigate('CategoryProduct', {
      categoryId,
      categoryName,
      products,
    });
  } catch (error) {
    console.error(`Lỗi khi tải sản phẩm của danh mục ${categoryId}:`, error);
  }
};


  if (loading) {
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((cat, idx) => (
          <View key={idx} style={styles.categoryCard}>
            <View style={styles.categoryImagesGrid}>
              {cat.products?.slice(0, 4).map((product: any, i: number) => (
                <Image
                  key={i}
                  source={{
                    uri: `http://localhost:8080/api/public/products/image/${product.image}`,
                  }}
                  style={styles.categoryImage}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.seeAllContainer}
              onPress={() => handleSeeAll(cat.categoryId, cat.categoryName)}
            >
            <View style={styles.categoryFooter}>
              <Text style={styles.categoryTitle}>{cat.categoryName}</Text>
              <View style={styles.categoryCountBox}>
                <Text style={styles.categoryCount}>{cat.productCount ?? 0}</Text>
              </View>
            </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    color: '#007aff',
    marginRight: 5,
  },
  seeAllContainer: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fbfbfb',
    elevation: 2,
    padding: 10,
  },
  categoryImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryImage: {
    width: '48%',
    height: 60,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingRight: 10,
    flex: 1,
  },
  categoryCountBox: {
    backgroundColor: '#e3e3e3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});