// app/screens/CartScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RowMap, SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/FontAwesome';

import { RootStackParamList } from '..';
import {
  getCartById,
  getCartIdByEmail,
  getSavedCartId,
  getUserEmail, // PUT /public/cart/items/{cartItemId} (giữ nguyên nếu backend đang vậy)
  removeProductFromCart,
  saveCartId,
  updateCartItemQtyById, // PUT /public/cart/items/{cartItemId} (giữ nguyên nếu backend đang vậy)
} from '../Api/ApiService';
import { CartItem, useCart } from './context/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const CartScreen = ({ navigation }: Props) => {
  const {
    cartItems,
    replaceCart,
    updateQuantity,
    updateQuantityByCartItemId,
    removeFromCart,
    removeByCartItemId,
    getTotalPrice,
  } = useCart();

  const [email, setEmail] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePayment = () => {
    navigation.navigate('Payment', {
      email: email ?? undefined,
      cartId: cartId ?? undefined,
    });
  };

  const getImageUrl = (imageName: string) => {
    return imageName
      ? `http://localhost:8080/api/public/products/image/${imageName}`
      : 'https://via.placeholder.com/300';
  };

  const mapRawToCartItem = (x: any): CartItem => ({
    id: Number(x.productId ?? x.product?.id ?? x.id),
    name: String(x.productName ?? x.product?.name ?? x.name ?? ''),
    price: Number(x.price ?? x.unitPrice ?? x.specialPrice ?? x.product?.price ?? 0),
    image:
      x.imageUrl ?? x.image ?? x.product?.imageUrl ?? x.product?.image ?? 'https://via.placeholder.com/100',
    color: x.color ?? x.variantColor ?? null,
    size: x.size ?? x.variantSize ?? null,
    quantity: Number(x.quantity ?? 1),
    cartItemId: x.id ?? x.cartItemId,
  });

  // tải lại giỏ từ server
  const refetchCart = async () => {
    if (cartId == null || !email) return;

    // (debug) xem token hiện tại
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const t = await AsyncStorage.getItem('jwt-token');
  // ...DEBUG log đã bị tắt...

    const data = await getCartById(email, cartId);
    const items = data?.items || data?.products || [];
    replaceCart((items || []).map(mapRawToCartItem));
  };

  // init email & cartId
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const savedEmail = await getUserEmail();
        setEmail(savedEmail);

        if (!savedEmail) {
          setCartId(null);
          replaceCart([]);
          return;
        }

        let cid = await getSavedCartId();
        if (!cid) {
          const foundId = await getCartIdByEmail(savedEmail);
          cid = foundId ? String(foundId) : null;
          if (cid) await saveCartId(cid);
        }
        setCartId(cid ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [replaceCart]);

  // load giỏ khi có cartId
  useEffect(() => {
    if (cartId == null) return;
    (async () => {
      setLoading(true);
      try {
        await refetchCart();
      } catch (err) {
        console.error('Lỗi tải giỏ hàng:', err);
        replaceCart([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [cartId, replaceCart]);

  // key mỗi dòng (ưu tiên cartItemId)
  const keyExtractor = (item: CartItem) =>
    item.cartItemId != null
      ? String(item.cartItemId)
      : `${item.id}-${item.color ?? 'no-color'}-${item.size ?? 'no-size'}`;

  // tăng/giảm số lượng
  const incQty = async (item: CartItem) => {
    const newQty = Number(item.quantity) + 1;

    if (item.cartItemId != null) {
      updateQuantityByCartItemId(item.cartItemId, newQty);
    } else {
      updateQuantity(item.id, newQty, item.color ?? undefined, item.size ?? undefined);
    }

    try {
      if (item.cartItemId != null && cartId != null) {
        await updateCartItemQtyById(cartId as string | number, item.id, newQty);
      }
    } catch (e) {
      console.error('Update qty lỗi:', (e as any)?.response?.data || e);
      await refetchCart();
    }
  };

  const decQty = async (item: CartItem) => {
    const newQty = Number(item.quantity) - 1;
    if (newQty <= 0) {
      Alert.alert('Xóa sản phẩm', 'Bạn muốn xóa khỏi giỏ?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => removeItem(item) },
      ]);
      return;
    }

    if (item.cartItemId != null) {
      updateQuantityByCartItemId(item.cartItemId, newQty);
    } else {
      updateQuantity(item.id, newQty, item.color ?? undefined, item.size ?? undefined);
    }

    try {
      if (item.cartItemId != null && cartId != null) {
        await updateCartItemQtyById(cartId as string | number, item.id, newQty);
      }
    } catch (e) {
      console.error('Update qty lỗi:', (e as any)?.response?.data || e);
      await refetchCart();
    }
  };

  // xoá với SwipeListView (đóng row + gọi API DELETE /public/carts/{cartId}/product/{productId})
  const removeItem = async (item: CartItem, rowMap?: RowMap<CartItem>) => {
    const key = keyExtractor(item);
    if (rowMap && rowMap[key]) rowMap[key].closeRow();

    const backup = [...cartItems];

    // Optimistic UI
    if (item.cartItemId != null) {
      removeByCartItemId(item.cartItemId);
    } else {
      removeFromCart(item.id, item.color ?? undefined, item.size ?? undefined);
    }

    try {
      if (cartId == null) throw new Error('Missing cartId');
      await removeProductFromCart(cartId, Number(item.id)); // ✅ dùng productId
      await refetchCart();
    } catch (e) {
      console.error('Xóa item lỗi:', (e as any)?.response?.data || e);
      replaceCart(backup); // rollback
      Alert.alert('Xóa sản phẩm', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const totalText = useMemo(
    () => `${getTotalPrice().toLocaleString('vi-VN')} ₫`,
    [getTotalPrice, cartItems]
  );

  const renderFront = (item: CartItem) => (
    <View style={styles.rowFront}>
      <Image source={{ uri: getImageUrl(item.image) }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
        <Text style={styles.variant}>{item.color ?? 'Default'} • Size {item.size ?? 'M'}</Text>
        <Text style={styles.price}>{(item.price || 0).toLocaleString('vi-VN')} ₫</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => decQty(item)}><Text style={styles.qButton}>−</Text></TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => incQty(item)}><Text style={styles.qButton}>+</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHidden = (item: CartItem, rowMap: RowMap<CartItem>) => (
    <View style={styles.rowBack}>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item, rowMap)}>
        <Text style={styles.deleteText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Đang tải giỏ hàng…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.addressRow}>
        <Text style={styles.addressLabel}>Shipping Address</Text>
        <Icon name="edit" size={18} color="#007BFF" />
      </View>
      <Text style={styles.addressText}>123 Đường ABC, Quận 1, TP.HCM</Text>

      <SwipeListView
        data={cartItems}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderFront(item)}
        renderHiddenItem={({ item }, rowMap) => renderHidden(item, rowMap)}
        rightOpenValue={-84}
        disableRightSwipe
        friction={15}
        tension={40}
        previewRowKey={cartItems[0] ? keyExtractor(cartItems[0]) : undefined}
        previewOpenValue={-60}
        previewOpenDelay={700}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>Giỏ hàng trống</Text>}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{totalText}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handlePayment}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default CartScreen;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  addressLabel: { fontSize: 14, fontWeight: '600' },
  addressText: { fontSize: 14, color: '#555', marginBottom: 16 },

  rowFront: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 2 },
  image: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f3f3f3' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: 'bold', fontSize: 16, color: '#111' },
  variant: { fontSize: 14, color: '#666', marginVertical: 4 },
  price: { fontSize: 15, color: '#007BFF', fontWeight: '600' },

  quantityControl: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qButton: { fontSize: 20, color: '#007BFF', paddingHorizontal: 10 },
  quantity: { fontSize: 16, marginHorizontal: 6 },

  rowBack: { flex: 1, flexDirection: 'row', backgroundColor: '#fdf2f2', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, marginBottom: 12, paddingLeft: 16 },
  deleteBtn: { width: 84, height: '100%', backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  deleteText: { color: '#fff', fontWeight: '700' },

  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', marginTop: 8, borderRadius: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#28a745', padding: 14, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
