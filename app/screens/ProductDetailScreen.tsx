import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
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
import type { RootStackParamList } from '../index';
import { useCart } from './context/CartContext';


import { addProductToCart, authFetch, getCartIdByEmail, getProductById, getUserEmail, saveCartId } from '../Api/ApiService';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const { addToCart, cartItems, replaceCart } = useCart();

  const colors = [
    { id: 1, name: 'Red', uri: 'https://via.placeholder.com/80/FF0000' },
    { id: 2, name: 'Green', uri: 'https://via.placeholder.com/80/00FF00' },
    { id: 3, name: 'Blue', uri: 'https://via.placeholder.com/80/0000FF' },
    { id: 4, name: 'Yellow', uri: 'https://via.placeholder.com/80/FFFF00' },
  ];

  const sizes = [
    { id: 1, name: 'S' },
    { id: 2, name: 'M' },
    { id: 3, name: 'L' },
    { id: 4, name: 'XL' },
    { id: 5, name: 'XXL' },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // GHÉP URL ảnh (nhớ đổi localhost -> IP LAN khi chạy device thật)
  const getImageUrl = (imageName: string) => {
    return imageName
      ? `http://localhost:8080/api/public/products/image/${imageName}`
      : 'https://via.placeholder.com/300';
  };

  // Map item từ API -> CartItem
  const mapRawToCartItem = (x: any) => ({
    id: Number(x.productId ?? x.product?.id ?? x.id),
    name: String(x.productName ?? x.product?.name ?? x.name ?? ''),
    price: Number(x.price ?? x.unitPrice ?? x.specialPrice ?? x.product?.price ?? 0),
    image:
      x.imageUrl ??
      x.image ??
      x.product?.imageUrl ??
      x.product?.image ??
      'https://via.placeholder.com/100',
    color: x.color ?? x.variantColor ?? null,
    size: x.size ?? x.variantSize ?? null,
    quantity: Number(x.quantity ?? 1),
    cartItemId: x.id ?? x.cartItemId,
  });

  // Đảm bảo có email + cartId, nếu chưa có cartId sẽ lấy cái đầu và lưu
  const ensureEmailAndCartId = async () => {
    const email = await getUserEmail();
    if (!email) throw new Error('Chưa đăng nhập');

    let cartId: string | number | null = await getCartIdByEmail(email);
    if (cartId) await saveCartId(cartId);
    if (!cartId) throw new Error('Không tìm thấy cart của người dùng');

    return { email, cartId };
  };

  const handleAddToCart = async () => {
    if (!product) return;


    try {
      const { email, cartId } = await ensureEmailAndCartId();
      // ✅ Thêm bằng cartId chuẩn backend
      await addProductToCart(cartId, product.productId, quantity);

      // Update context local: gộp theo biến thể để UI phản hồi tức thì
      const pickedColor = colors[selectedColor]?.name || 'Default';
      const pickedSize = sizes.find((sz) => sz.id === selectedSize)?.name || 'M';
      const existed = cartItems.find(
        (item) => item.id === product.productId && item.color === pickedColor && item.size === pickedSize
      );
      if (existed) {
        addToCart({ ...existed, quantity: existed.quantity + quantity });
      } else {
        addToCart({
          id: product.productId,
          name: product.productName,
          price: parseFloat(product.price),
          image: getImageUrl(product.image),
          color: pickedColor,
          size: pickedSize,
          quantity,
        });
      }

      // Refetch từ server để đồng bộ tuyệt đối (phòng khi backend merge khác)
      try {
        // const res = await fetch(getApiUrl(`public/carts/${cartId}`));
          const res = await authFetch(`public/users/${email}/carts/${cartId}`);
        const data = await res.json();
        const items = data.items || data.products || [];
        const mapped = (items || []).map(mapRawToCartItem);
        replaceCart(mapped);
      } catch {}

      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã thêm vào giỏ hàng!' });
    } catch (e: any) {
      console.error('Lỗi thêm sản phẩm vào giỏ hàng:', e?.response?.data || e);
      Toast.show({ type: 'error', text1: 'Lỗi', text2: e?.message || 'Không thể thêm vào giỏ hàng!' });
    }
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
        <Image source={{ uri: getImageUrl(product.image) }} style={styles.productImage} resizeMode="cover" />

        <View style={styles.content}>
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.price}>{parseFloat(product.price).toLocaleString()} ₫</Text>

          <Text style={styles.description}>{product.description || 'Mô tả sản phẩm đang cập nhật...'}</Text>

          <Text style={styles.label}>Màu sắc</Text>
          <FlatList
            horizontal
            data={colors}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => setSelectedColor(index)}>
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.colorOption, index === selectedColor && styles.selectedBorder]}
                />
                <Text style={{ textAlign: 'center', fontSize: 12 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.label}>Kích thước</Text>
          <View style={styles.sizeContainer}>
            {sizes.map((sz) => (
              <TouchableOpacity
                key={sz.id}
                style={[styles.sizeBox, selectedSize === sz.id && styles.selectedSize]}
                onPress={() => setSelectedSize(sz.id)}
              >
                <Text style={{ color: selectedSize === sz.id ? '#fff' : '#000' }}>{sz.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Số lượng</Text>
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
          <Text style={{ fontSize: 20, color: isFavorite ? 'red' : '#333' }}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={styles.buttonText}>Thêm giỏ hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buttonText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#000' },
  productImage: { width: '100%', height: 300 },
  content: { padding: 16 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  description: { marginTop: 8, fontSize: 14, color: '#555' },
  label: { marginTop: 16, fontSize: 16, fontWeight: 'bold' },

  colorOption: { width: 60, height: 60, borderRadius: 12, marginRight: 10, marginTop: 8 },
  selectedBorder: { borderWidth: 2, borderColor: '#000' },

  sizeContainer: { flexDirection: 'row', marginTop: 8 },
  sizeBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  selectedSize: { backgroundColor: '#000', borderColor: '#000' },

  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  quantityButton: { fontSize: 22, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
  quantityValue: { fontSize: 18, minWidth: 30, textAlign: 'center' },

  cartBtn: { backgroundColor: '#333', padding: 14, borderRadius: 10, flex: 1, marginRight: 10 },
  buyBtn: { backgroundColor: '#007BFF', padding: 14, borderRadius: 10, flex: 1 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },

  fixedBottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
