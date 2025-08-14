import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Toast from 'react-native-toast-message';
import AddressScreen from './screens/AdddressScreen';
import CartScreen from './screens/CartScreen';
import CategoryProductScreen from './screens/CategoryProductScreen';
import { CartProvider } from './screens/context/CartContext';
import HomeScreen from './screens/HomeScreen';
import HomeTab from './screens/homeTabs/HomeTab';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import PaymentScreen from './screens/PaymentScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import StartScreen from './screens/StartScreen';

export type RootStackParamList = {
  ProductDetail: { productId: number };
  CategoryProduct: {
    categoryId: number;
    categoryName: string;
    products: any[];
  };
  Start: undefined;
  Login: undefined;
  Main: undefined;
  Home: undefined;
  Cart: undefined;
  Profile: undefined;
  Onboarding: undefined;
  Address: undefined;
  Payment: { email?: string; cartId?: string | number } | undefined;
  OrderTracking: { orderId: string | number } | undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <CartProvider>
          <Stack.Navigator initialRouteName="Start">
      <Stack.Screen
        name="Start"
        component={StartScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Chi tiết sản phẩm' }}
      />
      
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Giỏ hàng' }}
      />

      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Thanh toán' }}
      />

      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Main"
        component={HomeTab}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CategoryProduct"
        component={CategoryProductScreen}
        options={{ title: 'Danh mục' }}
      />

      <Stack.Screen
        name="Address"
        component={AddressScreen}
        options={{ title: 'Địa chỉ' }}
      />

    </Stack.Navigator>

    <Toast />

    </CartProvider>

  );
};

export default App;
