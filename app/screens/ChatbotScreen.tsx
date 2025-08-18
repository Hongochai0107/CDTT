// screens/ChatbotScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { imgUrl, sendChatMessage } from '../Api/ApiService';
import type { RootStackParamList } from '../index';
import { useBubble } from '../providers/BubbleProvider';

type Product = {
  productId: number | string;
  productName: string;
  price: number;
  image?: string;
};

type TextMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ProductsMessage = {
  role: 'assistant';
  content: '__products__';
  products: Product[];
};

type ChatMessage = TextMessage | ProductsMessage;

export default function ChatbotScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setVisible } = useBubble();

  useEffect(() => {
    setVisible(false);
    return () => setVisible(true);
  }, [setVisible]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content:
        'Bạn là trợ lý thân thiện cho app mua sắm. Trả lời ngắn gọn, hữu ích, có thể gợi ý sản phẩm nếu phù hợp.',
    },
    { role: 'assistant', content: 'Xin chào! Mình có thể giúp gì cho bạn hôm nay? 😊' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [useMock, setUseMock] = useState(__DEV__); // Bật mock ở môi trường dev

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== 'system'),
    [messages]
  );

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [visibleMessages.length, scrollToEnd]);

  const humanError = (raw: any) => {
    const txt = String(raw || '');
    if (/429|insufficient_quota/i.test(txt)) {
      return 'Xin lỗi, hạn mức AI đã tạm hết. Bạn có thể bật mock hoặc thay API key.';
    }
    if (/timeout|network/i.test(txt)) {
      return 'Mạng chập chờn, vui lòng thử lại.';
    }
    return 'Xin lỗi, có lỗi xảy ra khi gọi Chatbot.';
  };

  const resolveImage = (raw?: string) => {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    return imgUrl(raw);
  };

  const goDetail = (p: Product) => {
    const pid = Number(p.productId);
    if (!Number.isNaN(pid)) {
      navigation.navigate('ProductDetail', { productId: pid });
    } else if (__DEV__) {
      console.warn('productId invalid:', p.productId);
    }
  };

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const outgoing: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(outgoing);
    setInput('');
    Keyboard.dismiss();
    scrollToEnd();

    try {
      setSending(true);

      // Gọi AI / mock
      const answer = await sendChatMessage(outgoing, useMock);
      const reply = answer.reply?.trim() || '[Không có nội dung trả về]';

      // 1) Thêm phản hồi text
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      // 2) Nếu có products → thêm 1 message loại __products__ để render card
      if (answer.products?.length) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '__products__', products: answer.products },
        ]);
      }

      scrollToEnd();
    } catch (e: any) {
      if (__DEV__) console.warn('[Chatbot] error:', e?.response?.data || e?.message || e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: humanError(e?.response?.data || e?.message) },
      ]);
      scrollToEnd();
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, scrollToEnd, useMock]);

  const toggleMock = () => {
    setUseMock((prev) => {
      const next = !prev;
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: `Chế độ mock đã được ${next ? 'bật' : 'tắt'}.` },
      ]);
      return next;
    });
    scrollToEnd();
  };

  // Bubble hiển thị danh sách sản phẩm
  const renderProductsBubble = (products: Product[]) => {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <View
          style={{
            backgroundColor: '#f8f8f8',
            borderRadius: 14,
            padding: 10,
            maxWidth: '92%',
          }}
        >
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            Danh sách sản phẩm phù hợp
          </Text>

          {products.map((p) => {
            const uri = resolveImage(p.image);
            return (
              <TouchableOpacity
                key={String(p.productId)}
                onPress={() => goDetail(p)}
                activeOpacity={0.85}
                style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' }}
                  />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' }} />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }} numberOfLines={2}>
                    {p.productName || '(Không có tên)'}
                  </Text>
                  <Text>{Number(p.price).toLocaleString('vi-VN')} ₫</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Bubble text
  const renderTextBubble = (item: TextMessage) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            backgroundColor: isUser ? '#007bff' : '#f1f1f1',
            borderRadius: 14,
            padding: 10,
          }}
        >
          <Text style={{ color: isUser ? '#fff' : '#222' }}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'system') return null;

    // Bubble danh sách sản phẩm
    if ('products' in item && item.content === '__products__') {
      return renderProductsBubble(item.products);
    }

    // Bubble text
    return renderTextBubble(item as TextMessage);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={visibleMessages}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
        />

        {sending && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingHorizontal: 12,
              paddingBottom: 6,
            }}
          >
            <View
              style={{
                maxWidth: '60%',
                backgroundColor: '#f1f1f1',
                borderRadius: 14,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ActivityIndicator />
              <Text>Đang trả lời…</Text>
            </View>
          </View>
        )}

        {/* Input row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 10,
            paddingBottom: Platform.OS === 'ios' ? 14 : 10,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
            placeholder="Nhập câu hỏi..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onSend}
            editable={!sending}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={sending || !input.trim()}
            style={{
              backgroundColor: sending || !input.trim() ? '#9ec1ff' : '#007bff',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {sending ? '...' : 'Gửi'}
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              onPress={toggleMock}
              style={{
                backgroundColor: useMock ? '#28a745' : '#dc3545',
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {useMock ? 'Mock' : 'API'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
