import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AutoCarouselBanner from './components/AutoCarouselBanner';
import SearchBar from './components/SearchBar';
import CategorySection from './homeSession/CategorySection';
import FlashSaleSection from './homeSession/FlashSaleSection';
import JustForYouSection from './homeSession/JustForYouSection';
import MostPopularSection from './homeSession/MostPopularSection';
import NewItemsSection from './homeSession/NewItemsSection';
import TopProductsSection from './homeSession/TopProductsSection';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.searchBox}>
          <SearchBar />
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <AutoCarouselBanner />
      </View> 

      <CategorySection />

      <TopProductsSection />

      <NewItemsSection />

      <FlashSaleSection />

      <MostPopularSection />

      <JustForYouSection />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
},
headerTitle: {
  marginLeft: 10,
  color: '#333',
  fontSize: 35,
  fontWeight: 'bold',
},
searchBox: {
  width: 250,
  height: 36,
},
  profileButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;

