import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile')}
      />
    
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});