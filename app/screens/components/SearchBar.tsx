// SearchBar.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const SearchBar = () => {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        placeholder="Search"
        placeholderTextColor="#999"
        style={styles.input}
      />
      <Ionicons name="camera-outline" size={20} color="#007bff" />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default SearchBar;
