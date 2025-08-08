// MostPopularSection.tsx
import { getAllProducts } from '@/app/Api/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../..';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const MostPopularSection = () => {
  const navigation = useNavigation<NavigationProp>();
  const [mostPopularItems, setMostPopularItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostPopularProducts = async () => {
      try {
        const products = await getAllProducts();
        setMostPopularItems(products);
      } catch (error) {
        console.error('Error fetching most popular products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMostPopularProducts();
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
        <Text style={styles.title}>Most Popular</Text>
        <View style={styles.seeAllContainer}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="arrow-forward" size={16} color="#007bff" />
        </View>
      </View>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mostPopularItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.card}>
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.image}
                  defaultSource={require('../../../assets/images/default_image.png')}
                  onError={(e) => {
                    // fallback to placeholder if image fails to load
                    e.currentTarget.setNativeProps({ src: [require('../../../assets/images/default_image.png')] });
                  }}
                />
                <View style={styles.footerRow}>
                  <Text style={styles.likes}>{item.likes} </Text>
                  <Ionicons name="heart" size={14} color="#007bff" />
                  <Text style={styles.tag}>  {item.tag}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

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
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#007bff',
    marginRight: 4,
  },
  card: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  likes: {
    fontWeight: 'bold',
  },
  tag: {
    fontWeight: '500',
  },
});

export default MostPopularSection;
