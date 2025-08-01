import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const productsColumn1 = [7, 9];
  const productsColumn2 = [8, 10];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
        <TextInput placeholder="Tìm kiếm sản phẩm..." style={styles.searchInput} />
      </View>

      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Thời trang', 'Điện tử', 'Gia dụng', 'Sách', 'Thể thao'].map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryButton}>
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.productCard}>
              <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.productImage} />
              <Text style={styles.productName}>Sản phẩm {item}</Text>
              <Text style={styles.productPrice}>100.000 VNĐ</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Sản phẩm khuyến mãi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[4, 5, 6].map((item) => (
            <View key={item} style={styles.productCard}>
              <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.productImage} />
              <Text style={styles.productName}>Sản phẩm {item}</Text>
              <Text style={styles.productPrice}>80.000 VNĐ</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>
        <View style={styles.productGrid}>
          <View style={styles.column}>
            {productsColumn1.map((item) => (
              <View key={item} style={styles.productCardGrid}>
                <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.productImage} />
                <Text style={styles.productName}>Sản phẩm {item}</Text>
                <Text style={styles.productPrice}>150.000 VNĐ</Text>
              </View>
            ))}
          </View>
          <View style={[styles.column, { marginTop: 30 }]}>
            {productsColumn2.map((item) => (
              <View key={item} style={styles.productCardGrid}>
                <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.productImage} />
                <Text style={styles.productName}>Sản phẩm {item}</Text>
                <Text style={styles.productPrice}>150.000 VNĐ</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.buttonText}>Đi tới trang cá nhân</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    elevation: 2,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  categoryText: {
    color: '#fff',
  },
  featuredContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productCard: {
    width: 150,
    alignItems: 'center',
    marginRight: 15,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  productName: {
    fontSize: 16,
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#007bff',
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  productCardGrid: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    padding: 10,
  },
  profileButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

