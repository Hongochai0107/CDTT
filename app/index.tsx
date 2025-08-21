import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Toast from 'react-native-toast-message';
import { BubbleProvider } from './providers/BubbleProvider';
import AddressScreen from './screens/AddressScreen';
import CartScreen from './screens/CartScreen';
import CategoryProductScreen from './screens/CategoryProductScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import FloatingChatBubble from './screens/components/FloatingChatBubble';
import { CartProvider } from './screens/context/CartContext';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import HomeTab from './screens/homeTabs/HomeTab';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import PaymentScreen from './screens/PaymentScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import RegisterScreen from './screens/RegisterScreen';
import SearchProductsScreen from './screens/SearchProductsScreen';
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
  Address: { mode?: 'manage' | 'select' } | undefined;
  Payment: { email?: string; cartId?: string | number } | undefined;
  OrderTracking: { orderId: string | number } | undefined;
  Search: { initialQuery?: string } | undefined;
  Chatbot: undefined;
  Orders: undefined;
  ForgotPassword: undefined;
  Register:{ email?: string; password?: string | number } | undefined;
};

export interface Product {
  productId: number | string;
  productName: string;
  price: number;
  image?: string;
  categoryId?: number;
}


const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <CartProvider>
      <BubbleProvider>
          <Stack.Navigator initialRouteName="Start">
            <Stack.Screen
              name="Start"
              component={StartScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Đăng ký' }}
            />

            <Stack.Screen
              name="Chatbot"
              component={ChatbotScreen}
              options={{ title: 'Chatbot AI' }}
            />

            <Stack.Screen
              name="Search"
              component={SearchProductsScreen}
              options={{ title: 'Tìm kiếm sản phẩm' }}
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

            <Stack.Screen name="ForgotPassword"
             component={ForgotPasswordScreen}
              options={{ title: "Quên mật khẩu" }} 
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
              options={{ title: 'Theo dõi đơn hàng' }}
            />

            <Stack.Screen
              name="Orders"
              component={OrdersScreen}
              options={{ title: 'Quản lý đơn hàng' }}
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

        <FloatingChatBubble />

      </BubbleProvider>

      <Toast />

    </CartProvider>

  );
};

export default App;
