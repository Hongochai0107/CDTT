// MostPopularSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const mostPopularItems = [
  {
    id: 1,
    image: require('../../../assets/images/flashsales2.png'),
    tag: 'New',
    likes: 1780,
  },
  {
    id: 2,
    image: require('../../../assets/images/flashsales1.png'),
    tag: 'Sale',
    likes: 1780,
  },
  {
    id: 3,
    image: require('../../../assets/images/flashsales3.png'),
    tag: 'Hot',
    likes: 1780,
  },
  {
    id: 4,
    image: require('../../../assets/images/flashsales6.png'),
    tag: 'Trend',
    likes: 1780,
  },
];

const MostPopularSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Most Popular</Text>
        <View style={styles.seeAllContainer}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="arrow-forward" size={16} color="#007bff" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {mostPopularItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.footerRow}>
              <Text style={styles.likes}>{item.likes} </Text>
              <Ionicons name="heart" size={14} color="#007bff" />
              <Text style={styles.tag}>  {item.tag}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
