import React from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { CartItem, useCart } from './context/CartContext';

const wishlist = [
  {
    id: 101,
    name: 'Wishlist A',
    price: 29.99,
    image: 'https://via.placeholder.com/100',
  },
  {
    id: 102,
    name: 'Wishlist B',
    price: 39.99,
    image: 'https://via.placeholder.com/100',
  },
];

const CartScreen = ({ navigation }: { navigation: any }) => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const handleIncrease = (id: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) updateQuantity(id, item.quantity + 1);
  };

  const handleDecrease = (id: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item && item.quantity > 1) updateQuantity(id, item.quantity - 1);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.color && item.size && (
          <Text style={styles.variant}>
            {item.color}, Size {item.size}
          </Text>
        )}
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
          <Icon name="trash" size={20} color="red" />
        </TouchableOpacity>

        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => handleDecrease(item.id)}>
            <Text style={styles.qButton}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => handleIncrease(item.id)}>
            <Text style={styles.qButton}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.addressRow}>
        <Text style={styles.addressLabel}>Shipping Address</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Address')}>
          <Icon name="edit" size={18} color="#007BFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.addressText}>123 Đường ABC, Quận 1, TP.HCM</Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.wishlistSection}>
        <Text style={styles.wishlistTitle}>You might also like</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {wishlist.map((item) => (
            <View key={item.id} style={styles.wishlistItem}>
              <Image source={{ uri: item.image }} style={styles.wishlistImage} />
              <Text style={styles.wishlistName}>{item.name}</Text>
              <Text style={styles.wishlistPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  variant: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  price: {
    fontSize: 15,
    color: '#007BFF',
    fontWeight: '600',
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  qButton: {
    fontSize: 20,
    color: '#007BFF',
    paddingHorizontal: 10,
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 6,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wishlistSection: {
    marginTop: 24,
  },
  wishlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  wishlistItem: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  wishlistImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 6,
  },
  wishlistName: {
    fontSize: 14,
    fontWeight: '500',
  },
  wishlistPrice: {
    fontSize: 13,
    color: '#007BFF',
  },
});

export default CartScreen;
