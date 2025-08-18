// components/FloatingChatBubble.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../index';
import { useBubble } from '../../providers/BubbleProvider';

const BUBBLE_SIZE = 56;

export default function FloatingChatBubble() {
  const { visible } = useBubble();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const pan = useRef(new Animated.ValueXY({ x: 16, y: 200 })).current;
  const last = useRef({ x: 16, y: 200 }).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 3,
      onPanResponderGrant: () => { pan.setOffset({ x: last.x, y: last.y }); },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        // snap về trái/phải
        const screenW = g.moveX + 0; // RN không có width ở đây; ta snap đơn giản theo vị trí chạm
        const toLeft = g.moveX < 200;
        const targetX = toLeft ? 16 : (/* giả định */ 16); // nếu muốn tính width màn hình, dùng Dimensions.get('window').width
        const targetY = Math.max(insets.top + 16, Math.min(g.moveY - BUBBLE_SIZE, 600));

        Animated.spring(pan, { toValue: { x: toLeft ? 16 : (/*right*/ 16), y: targetY }, useNativeDriver: false }).start(() => {
          last.x = toLeft ? 16 : 16;
          last.y = targetY;
        });
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Chatbot')}
        style={styles.bubble}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
});
