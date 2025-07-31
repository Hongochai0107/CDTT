import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const ProfileScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>

      <Button
        title="Go back"
        onPress={() => navigation.goBack()}
        color="#020202"
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
});