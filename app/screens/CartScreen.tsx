import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CartScreen =  ({ navigation }: { navigation: any }) => {
  const cartItems = [
    { id: 1, name: 'Sản phẩm A', price: '100.000 VNĐ', quantity: 1, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Sản phẩm B', price: '200.000 VNĐ', quantity: 2, image: 'https://via.placeholder.com/150' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
              <Text style={styles.productQuantity}>Số lượng: {item.quantity}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.checkoutButton}>
        <Text style={styles.checkoutText}>Thanh toán</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 5,
  },
  productQuantity: {
    fontSize: 14,
    marginTop: 5,
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
