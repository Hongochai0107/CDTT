import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { getProductById } from '../Api/ApiService';
import { RootStackParamList } from '../index';
import { useCart } from './context/CartContext';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const { addToCart } = useCart();

  const colors = [
    { id: 1, uri: 'https://via.placeholder.com/80/FF0000' },
    { id: 2, uri: 'https://via.placeholder.com/80/00FF00' },
    { id: 3, uri: 'https://via.placeholder.com/80/0000FF' },
    { id: 4, uri: 'https://via.placeholder.com/80/FFFF00' },
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);
        console.log("Product nhận được:", data);
        setProduct(data);
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const getImageUrl = (imageName: string) => {
    return imageName
      ? `http://localhost:8080/api/public/products/image/${imageName}`
      : 'https://via.placeholder.com/300';
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.productId,
      name: product.productName,
      price: parseFloat(product.price),
      image: getImageUrl(product.image),
      color: colors[selectedColor].uri,
      size: selectedSize,
      quantity: quantity,
    });

    Toast.show({
      type: 'success',
      text1: 'Thành công',
      text2: 'Đã thêm vào giỏ hàng!',
    });
  };

  if (loading || !product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Image
          source={{ uri: getImageUrl(product.image) }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.price}>
            {parseFloat(product.price).toLocaleString()} ₫
          </Text>

          <Text style={styles.description}>
            {product.description || 'Mô tả sản phẩm đang cập nhật...'}
          </Text>

          <Text style={styles.label}>Color Options</Text>
          <FlatList
            horizontal
            data={colors}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => setSelectedColor(index)}>
                <Image
                  source={{ uri: item.uri }}
                  style={[
                    styles.colorOption,
                    index === selectedColor && styles.selectedBorder,
                  ]}
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.label}>Size</Text>
          <View style={styles.sizeContainer}>
            {sizes.map((sz) => (
              <TouchableOpacity
                key={sz}
                style={[
                  styles.sizeBox,
                  selectedSize === sz && styles.selectedSize,
                ]}
                onPress={() => setSelectedSize(sz)}
              >
                <Text style={{ color: selectedSize === sz ? '#fff' : '#000' }}>
                  {sz}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.quantityButton}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.quantityButton}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={[styles.heartBtn, isFavorite && { backgroundColor: '#fac8c8' }]}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Text style={{ fontSize: 20, color: isFavorite ? 'red' : '#333' }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={styles.buttonText}>Add to cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buttonText}>Buy now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  productImage: { width: '100%', height: 300 },
  content: { padding: 16 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  description: { marginTop: 8, fontSize: 14, color: '#555' },
  label: { marginTop: 16, fontSize: 16, fontWeight: 'bold' },

  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
    marginTop: 8,
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: '#000',
  },

  sizeContainer: { flexDirection: 'row', marginTop: 8 },
  sizeBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  selectedSize: {
    backgroundColor: '#000',
    borderColor: '#000',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  quantityButton: {
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  quantityValue: {
    fontSize: 18,
    minWidth: 30,
    textAlign: 'center',
  },

  cartBtn: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  buyBtn: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 10,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    zIndex: 10,
  },
  heartBtn: {
    backgroundColor: '#ebe6e6',
    padding: 12,
    marginRight: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
});

export default ProductDetailScreen;
