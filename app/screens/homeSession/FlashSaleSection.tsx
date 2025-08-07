// FlashSaleSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const flashSales = [
  require('../../../assets/images/flashsales1.png'),
  require('../../../assets/images/flashsales2.png'),
  require('../../../assets/images/flashsales3.png'),
  require('../../../assets/images/flashsales4.png'),
  require('../../../assets/images/flashsales5.png'),
  require('../../../assets/images/flashsales6.png'),
];

const FlashSaleSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Flash Sale</Text>
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={16} color="#007bff" />
          <Text style={styles.timerText}>00</Text>
          <Text style={styles.timerText}>36</Text>
          <Text style={styles.timerText}>58</Text>
        </View>
      </View>

      <FlatList
        data={flashSales}
        renderItem={({ item, index }) => (
          <View key={index} style={styles.card}>
            <Image source={item} style={styles.image} />
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-20%</Text>
            </View>
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardSize = (width - 60) / 3;

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
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: cardSize,
    height: cardSize,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default FlashSaleSection;
