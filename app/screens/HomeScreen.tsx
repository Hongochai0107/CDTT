// import React from 'react';
// import { ScrollView, StyleSheet, Text, View } from 'react-native';
// import AutoCarouselBanner from './components/AutoCarouselBanner';
// import SearchBar from './components/SearchBar';
// import CategorySection from './homeSession/CategorySection';
// import FlashSaleSection from './homeSession/FlashSaleSection';
// import JustForYouSection from './homeSession/JustForYouSection';
// import MostPopularSection from './homeSession/MostPopularSection';
// import NewItemsSection from './homeSession/NewItemsSection';
// import TopProductsSection from './homeSession/TopProductsSection';

// const HomeScreen = ({ navigation }: { navigation: any }) => {
//   return (
    
//     <ScrollView style={styles.container}>
//       <View style={styles.headerRow}>
//         <Text style={styles.headerTitle}>Shop</Text>
//         <View style={styles.searchBox}>
//           <SearchBar />
//         </View>
//       </View>

//       <View style={{ marginTop: 10 }}>
//         <AutoCarouselBanner />
//       </View> 

//       <CategorySection />

//       <TopProductsSection />

//       <NewItemsSection />

//       <FlashSaleSection />

//       <MostPopularSection />

//       <JustForYouSection />

//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     padding: 20,
//   },
//   headerRow: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   marginBottom: 20,
// },
// headerTitle: {
//   marginLeft: 10,
//   color: '#333',
//   fontSize: 35,
//   fontWeight: 'bold',
// },
// searchBox: {
//   width: 250,
//   height: 36,
// },
//   profileButton: {
//     backgroundColor: '#007bff',
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
// });

// export default HomeScreen;

// screens/HomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../index'; // Đường dẫn tới file khai báo RootStackParamList (sửa lại nếu khác)

import AutoCarouselBanner from './components/AutoCarouselBanner';
import CategorySection from './homeSession/CategorySection';
import FlashSaleSection from './homeSession/FlashSaleSection';
import JustForYouSection from './homeSession/JustForYouSection';
import MostPopularSection from './homeSession/MostPopularSection';
import NewItemsSection from './homeSession/NewItemsSection';
import TopProductsSection from './homeSession/TopProductsSection';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={styles.container}>
      {/* Ô tìm kiếm GIẢ (ấn để mở màn Search) */}
      <View style={{ paddingHorizontal: 4, marginBottom: 10 }}>
        {/* <Text style={styles.headerTitle}>Clothing Fashion Store</Text> */}
        <TouchableOpacity
          style={styles.fakeSearch}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <Text style={{ color: '#999' }}>Tìm kiếm sản phẩm...</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10 }}>
        <AutoCarouselBanner />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chatbot')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007bff" />
          <Text style={{ color: '#007bff', fontWeight: '600' }}>Chatbot</Text>
        </TouchableOpacity>
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
  fakeSearch: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
  marginLeft: 10,
  color: '#333',
  fontSize: 35,
  fontWeight: 'bold',
},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});

export default HomeScreen;
