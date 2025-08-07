// TopProductsSection.tsx
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const topProducts = [
  require('../../../assets/images/bag.png'),
  require('../../../assets/images/skirts.png'),
  require('../../../assets/images/shoes.png'),
  require('../../../assets/images/Placeholder_01.png'),
  require('../../../assets/images/Placeholder_02.png'),
];

const TopProductsSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Products</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {topProducts.map((img, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={img} style={styles.image} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default TopProductsSection;
