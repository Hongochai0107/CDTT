// NewItemsSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const newItems = [
  {
    id: 1,
    name: 'Sneaker Blue',
    price: '$17.00',
    image: require('../../../assets/images/Image.png'),
  },
  {
    id: 2,
    name: 'Sport Gray',
    price: '$32.00',
    image: require('../../../assets/images/image2.png'),
  },
  {
    id: 3,
    name: 'Sneaker White',
    price: '$21.00',
    image: require('../../../assets/images/Image3.png'),
  },
];

const NewItemsSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>New Items</Text>
        <View style={styles.seeAllContainer}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="arrow-forward" size={16} color="#007bff" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {newItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.price}>{item.price}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
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
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  price: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default NewItemsSection;
