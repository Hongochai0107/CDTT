// app/screens/PaymentScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import WebView, { WebViewProps } from 'react-native-webview';

import { RootStackParamList } from '..';
import {
  createVnpayIntent,
  finalizePaidOrder,
  getAdminAddress,
  getCartById,
  getSavedCartId,
  getShippingFee,
  getUserEmail,
  getVnpIntentStatus,
  listUserOrders, // <— thêm
} from '../Api/ApiService';
import { useCart } from './context/CartContext';

type ShippingOption = 'standard' | 'express';
type PaymentMethod = 'vnpay' | 'CASH';
type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

/** Hosts */
const VNPAY_HOST =
  process.env.EXPO_PUBLIC_VNPAY_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

/** RETURN cho backend Node (Node sẽ xử lý & redirect về CLOSE_URL) */
const RETURN_URL = `${VNPAY_HOST}/api/payment/vnpay/return`;

/** Platform flags */
const IS_WEB = Platform.OS === 'web';

/** Chốt CLOSE_URL về chính route Payment cố định (web) */
const WEB_PAYMENT_PATH = '/screens/PaymentScreen';  // đổi đúng path linking của bạn
const CLOSE_URL = IS_WEB
  ? (typeof window !== 'undefined'
      ? `${window.location.origin}${WEB_PAYMENT_PATH}`
      : '')
  : 'https://vnpay-close.local/';

/** Debug helpers */
const DEBUG = true;
const ts = () => new Date().toISOString().slice(11, 19);
const toNumber = (v: any) =>
  typeof v === 'number' ? (Number.isFinite(v) ? v : 0)
  : typeof v === 'string' ? (Number(v.replace(/[^\d.-]/g, '')) || 0) : 0;

const PaymentScreen = ({ navigation, route }: Props) => {
  const { cartItems, replaceCart, getTotalPrice } = useCart();

  const [debugOpen, setDebugOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const safeJson = (v: any) => { try { return JSON.stringify(v); } catch { return String(v); } };
  const dlog = (msg: string, data?: any) => {
    if (!DEBUG) return;
    const line = `[${ts()}] ${msg}${data !== undefined ? ' ' + safeJson(data) : ''}`;
    console.log('[Payment]', msg, data);
    setLogs(prev => [line, ...prev].slice(0, 300));
  };

  // IDs
  const [email, setEmail] = useState<string | null>(route?.params?.email ?? null);
  const [cartId, setCartId] = useState<string | number | null>(route?.params?.cartId ?? null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<any>(null);
  const [phone, setPhone] = useState<string>('');
  const [shipping, setShipping] = useState<ShippingOption>('standard');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [etaText, setEtaText] = useState<string>('5–7 ngày');
  const [paymentSheet, setPaymentSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');
  const [progressing, setProgressing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; title: string; msg: string } | null>(null);

  // Intent & WebView
  const [currentOrderId, setCurrentOrderId] = useState<string | number | null>(null); // Node intent id (numeric)
  const [webVisible, setWebVisible] = useState(false);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [wvLoading, setWvLoading] = useState(false);

  // Totals
  const rawSubtotal = useMemo(() => getTotalPrice(), [cartItems, getTotalPrice]);
  const subtotal = useMemo(() => toNumber(rawSubtotal), [rawSubtotal]);
  const safeShippingFee = useMemo(() => toNumber(shippingFee), [shippingFee]);
  const grandTotal = useMemo(() => Math.max(0, subtotal + safeShippingFee), [subtotal, safeShippingFee]);
  const formatVND = (n: number) => `${toNumber(n).toLocaleString('vi-VN')} ₫`;

  /** Helper: xóa ?rcode=...&orderId=... khỏi URL (web) */
  const clearWebQuery = () => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('rcode') || url.searchParams.has('orderId')) {
      url.searchParams.delete('rcode');
      url.searchParams.delete('orderId');
      window.history.replaceState({}, '', `${url.origin}${url.pathname}`);
      dlog('WEB_CLEAR_QUERY');
    }
  };

  /** INIT */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        dlog('INIT_START', { routeParams: route?.params, RETURN_URL, CLOSE_URL });

        // Web: nếu có query từ Node redirect thì xử lý luôn ở đây (để không lặp)
        if (IS_WEB && typeof window !== 'undefined') {
          const u = new URL(window.location.href);
          const rcode = u.searchParams.get('rcode');
          const intentIdFromUrl = u.searchParams.get('orderId');
          if (rcode && intentIdFromUrl) {
            dlog('WEB_RETURN_DETECTED', { rcode, intentIdFromUrl });
            await handleReturnFromGateway(rcode, intentIdFromUrl);
            clearWebQuery(); // quan trọng: xóa query để không chạy lại
          }
        }

        const e = email ?? (await getUserEmail());
        const cid = cartId ?? (await getSavedCartId());
        setEmail(e ?? null);
        setCartId(cid ?? null);
        dlog('INIT_IDS', { email: e, cartId: cid });

        if (e && cid) {
          const data = await getCartById(e, cid);
          const items = data?.items || data?.products || [];
          const mapped = (items || []).map((x: any) => ({
            id: Number(x.productId ?? x.product?.id ?? x.id),
            name: String(x.productName ?? x.product?.name ?? x.name ?? ''),
            price: toNumber(x.price ?? x.unitPrice ?? x.specialPrice ?? x.product?.price ?? 0),
            image: x.imageUrl ?? x.image ?? x.product?.imageUrl ?? x.product?.image ?? 'https://via.placeholder.com/100',
            quantity: Number(x.quantity ?? 1),
            cartItemId: x.id ?? x.cartItemId,
          }));
          replaceCart(mapped);
          dlog('CART_REFRESHED', { serverCount: (items || []).length, mappedCount: mapped.length });
        }

        // Địa chỉ mặc định (qua /admin/addresses với proxy trong ApiService)
        try {
          if (e) {
            const raw = await getAdminAddress();
            if (raw) {
              const addr = {
                line1: raw?.street || raw?.line1 || raw?.addressLine1 || raw?.detail || '',
                city: raw?.city || '',
                state: raw?.state || raw?.province || raw?.district || '',
                country: raw?.country || 'VN',
                postalCode: raw?.zipCode || raw?.postalCode || '',
                phone: raw?.phone || raw?.mobile || '',
                fullName: raw?.fullName || raw?.receiverName || '',
              };
              setAddress(addr);
              setPhone(addr.phone || '');
              dlog('ADDRESS_USER_DEFAULT_OK', addr);
            } else {
              dlog('ADDRESS_USER_DEFAULT_EMPTY');
              setAddress(null);
            }
          }
        } catch (err: any) {
          dlog('ADDRESS_USER_DEFAULT_ERR', { status: err?.response?.status, message: err?.message });
          setAddress(null);
        }
      } catch (err) {
        dlog('INIT_ERR', err);
      } finally {
        setLoading(false);
        dlog('INIT_DONE');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Nhận địa chỉ trả về từ AddressScreen (mode: select) */
  useEffect(() => {
    const picked = (route?.params as any)?.address;
    if (picked && typeof picked === 'object') {
      const mapped = {
        line1: picked.street || '',
        city: picked.city || '',
        state: picked.state || '',
        country: picked.country || 'VN',
        postalCode: picked.pincode || '',
        phone: address?.phone || '',
        fullName: address?.fullName || '',
      };
      setAddress(mapped);
      navigation.setParams({ address: undefined } as any);
    }
  }, [route?.params]);

  /** SHIPPING FEE */
  useEffect(() => {
    (async () => {
      try {
        dlog('SHIP_CALC_START', { shipping, subtotal });
        const resp = await getShippingFee(shipping, Math.max(0, subtotal));
        if (resp?.fee != null) setShippingFee(resp.fee);
        setEtaText(resp?.eta || (shipping === 'standard' ? '5–7 ngày' : '1–2 ngày'));
        dlog('SHIP_CALC_OK', resp);
      } catch {
        setShippingFee(shipping === 'standard' ? 0 : 12000);
        setEtaText(shipping === 'standard' ? '5–7 ngày' : '1–2 ngày');
      }
    })();
  }, [shipping, subtotal]);

  /** Poll Node intent status */
  async function waitUntilPaidViaNode(orderId: string | number, tries = 20, intervalMs = 1500) {
    for (let i = 0; i < tries; i++) {
      try {
        const info = await getVnpIntentStatus(orderId);
        if (info?.status === 'PAID') return true;
        if (info?.status === 'FAILED') return false;
      } catch { /* ignore and retry */ }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  }

  /** Lấy orderId của shop BE từ response finalize hoặc fallback danh sách đơn */
  async function resolveShopOrderId(finalizeResp: any, userEmail: string) {
    // cố gắng bắt các field hay gặp
    const id =
      finalizeResp?.orderId ??
      finalizeResp?.id ??
      finalizeResp?.data?.orderId ??
      finalizeResp?.data?.id ??
      finalizeResp?.order?.id ??
      finalizeResp?.order?.orderId;

    if (id) return id;

    // fallback: lấy đơn mới nhất của user
    try {
      const list = await listUserOrders(userEmail);
      if (Array.isArray(list) && list.length) {
        // ưu tiên đơn PAID mới nhất
        const paidFirst = [...list].sort((a: any, b: any) => {
          const ap = (a.orderStatus || a.paymentStatus || '').toString().toUpperCase() === 'PAID' ? 1 : 0;
          const bp = (b.orderStatus || b.paymentStatus || '').toString().toUpperCase() === 'PAID' ? 1 : 0;
          if (ap !== bp) return bp - ap;
          const ta = new Date(a.createdAt || a.created_at || a.time || 0).getTime();
          const tb = new Date(b.createdAt || b.created_at || b.time || 0).getTime();
          return tb - ta;
        });
        const top = paidFirst[0];
        return top?.orderId ?? top?.id;
      }
    } catch (e) {
      dlog('RESOLVE_ORDER_FALLBACK_ERR', String(e));
    }
    return null;
  }

  /** Xử lý khi Node redirect về CLOSE_URL (web & native) */
  const handleReturnFromGateway = async (rcode: string, intentId: string) => {
    dlog('HANDLE_RETURN', { rcode, intentId });
    if (!email || !cartId) return;

    // Native: WebView đã đóng trước khi vào đây
    try {
      const paid = await waitUntilPaidViaNode(intentId);
      if (paid) {
        // build items hiện tại từ cart
        const items = cartItems.map(it => ({
          productId: Number(it.id),
          quantity: Number(it.quantity),
          price: toNumber(it.price),
        }));

        // finalize tại shop BE (tạo order & clear cart)
        const finalizeResp = await finalizePaidOrder(email!, cartId!, {
          address,
          shippingOption: shipping,
          voucherCode: null,
          totals: {
            subtotal,
            discount: 0,
            shippingFee: safeShippingFee,
            total: Math.round(toNumber(grandTotal)),
          },
          items,
          intentId, // để BE log mapping
        });

        // Lấy đúng orderId của SHOP BE để tracking
        const shopOrderId = await resolveShopOrderId(finalizeResp, email!);

        if (shopOrderId) {
          dlog('FINALIZE_OK_ORDERID', shopOrderId);
          navigation.replace('OrderTracking', { orderId: String(shopOrderId) });
          return;
        }

        // không lấy được id → điều hướng OrderTracking không id (tự show list)
        dlog('FINALIZE_OK_NO_ID');
        navigation.replace('OrderTracking' as any);
        return;
      }

      // Không PAID → không tạo order, giữ nguyên giỏ, show message (ở lại Payment)
      setResult({
        ok: false,
        title: rcode === 'FAILED' ? 'Thanh toán thất bại' : 'Đã huỷ thanh toán',
        msg: 'Giỏ hàng của bạn vẫn được giữ nguyên.',
      });
    } catch (e: any) {
      dlog('HANDLE_RETURN_ERR', e?.message || e);
      setResult({ ok: false, title: 'Có lỗi khi xác nhận', msg: e?.message || 'Vui lòng thử lại.' });
    }
  };

  /** WebView guard cho native */
  const onShouldStartLoad: NonNullable<WebViewProps['onShouldStartLoadWithRequest']> = (req) => {
    const url: string = (req as any)?.url ?? '';
    dlog('WEBVIEW_NAV', url);

    if (url.startsWith('appios://') || url.startsWith('exp://')) return false;

    if (url.startsWith(CLOSE_URL)) {
      try {
        const u = new URL(url);
        const rcode = u.searchParams.get('rcode') || '';
        const intentId = u.searchParams.get('orderId') || String(currentOrderId || '');

        // đóng webview ngay
        setWebVisible(false);
        setWebUrl(null);

        // xác nhận thanh toán + finalize
        (async () => {
          await handleReturnFromGateway(rcode, intentId);
        })();
      } catch (e) {
        dlog('WEBVIEW_NAV_PARSE_ERR', String(e));
        setWebVisible(false);
        setWebUrl(null);
        setResult({ ok: false, title: 'Có lỗi khi xác nhận', msg: 'Vui lòng kiểm tra đơn hàng.' });
      }
      return false;
    }
    return true;
  };

  /** Thanh toán (flow B) */
  const handlePay = async () => {
    if (!email || !cartId) return Alert.alert('Thanh toán', 'Bạn cần đăng nhập để thanh toán.');
    if (!cartItems?.length) return Alert.alert('Giỏ hàng', 'Giỏ hàng trống.');
    if (!address) return Alert.alert('Địa chỉ', 'Vui lòng thêm/chọn địa chỉ giao hàng.');

    const amount = Math.round(toNumber(grandTotal));
    if (!(amount > 0)) return Alert.alert('Không thể thanh toán', 'Tổng tiền phải lớn hơn 0.');

    try {
      setProgressing(true);

      const items = cartItems.map(it => ({
        productId: Number(it.id),
        quantity : Number(it.quantity),
        price    : toNumber(it.price),
      }));

      // Node sẽ redirect về CLOSE_URL
      const backendReturnUrl = `${RETURN_URL}?next=${encodeURIComponent(CLOSE_URL)}`;

      // 1) Tạo intent ở Node
      const intent = await createVnpayIntent({
        email: email!, cartId: cartId!,
        amount, items,
        returnUrl: backendReturnUrl,
        locale: 'vn',
      });

      const intentId = intent.orderId; // numeric string
      setCurrentOrderId(intentId);

      if (paymentMethod === 'vnpay') {
        const payUrl = intent?.payUrl;
        if (!payUrl) {
          setResult({ ok: false, title: 'Không khởi tạo được VNPAY', msg: 'Server không trả payUrl.' });
          setProgressing(false);
          return;
        }

        if (IS_WEB) {
          // Web: chuyển trang thẳng tới VNPay
          window.location.assign(payUrl);
          setProgressing(false);
          return;
        }

        // Native: mở WebView
        setWebUrl(payUrl);
        setWebVisible(true);
        setProgressing(false);
        return;
      }

      // (Nếu chọn COD – hiếm dùng trong flow B)
      setProgressing(false);
      Alert.alert('Đặt hàng', 'Bạn đang chọn COD. Vui lòng dùng flow COD riêng.');
    } catch (err: any) {
      dlog('PAY_ERR', err?.message || err);
      setResult({ ok: false, title: 'Không khởi tạo được thanh toán', msg: err?.message || 'Vui lòng thử lại.' });
      setProgressing(false);
    } finally {
      dlog('PAY_END');
    }
  };

  const canPay = !!email && !!cartId && !!cartItems?.length && !!address && grandTotal > 0;

  if (loading) {
    return (<View style={s.center}><ActivityIndicator size="large" /><Text style={{ marginTop: 8 }}>Đang tải…</Text></View>);
  }

  return (
    <View style={s.container}>
      {/* Địa chỉ giao hàng */}
      <Section title="Địa chỉ giao hàng" onEdit={() => navigation.navigate('Address', { mode: 'select' })}>
        <Text style={s.textMuted}>
          {address
            ? `${address.line1 ?? ''}, ${address.city ?? ''}, ${address.state ?? ''}, ${address.country ?? ''} ${address.postalCode ?? ''}`
            : 'Chưa có địa chỉ'}
        </Text>
      </Section>

      {/* Thông tin liên hệ */}
      <Section title="Thông tin liên hệ" onEdit={() => Alert.alert('Sửa liên hệ', 'Mở popup sửa liên hệ')}>
        {!!email && <Text style={s.textMuted}>{email}</Text>}
        {!!phone && <Text style={s.textMuted}>{phone}</Text>}
      </Section>

      {/* Sản phẩm */}
      <View style={[s.card, { paddingBottom: 4 }]}>
        <View style={s.rowBetween}><Text style={s.title}>Sản phẩm</Text></View>
        <FlatList
          data={cartItems}
          keyExtractor={(it) => String(it.cartItemId ?? it.id)}
          renderItem={({ item }) => (
            <View style={s.itemRow}>
              <Image source={{ uri: item.image }} style={s.itemImg} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={s.itemName}>{item.name}</Text>
                <Text style={s.itemPrice}>{formatVND(item.price)}</Text>
              </View>
              <Text style={s.qty}>x{item.quantity}</Text>
            </View>
          )}
        />
      </View>

      {/* Vận chuyển */}
      <View style={s.card}>
        <Text style={s.title}>Phương thức vận chuyển</Text>
        <RadioRow
          checked={shipping === 'standard'}
          left={<Text style={s.radioTitle}>Tiêu chuẩn <Text style={s.textMutedSmall}>5–7 ngày</Text></Text>}
          right={<Text style={[s.price, { color: '#10B981' }]}>MIỄN PHÍ</Text>}
          onPress={() => setShipping('standard')}
        />
        <RadioRow
          checked={shipping === 'express'}
          left={<Text style={s.radioTitle}>Nhanh <Text style={s.textMutedSmall}>1–2 ngày</Text></Text>}
          right={<Text style={s.price}>{formatVND(12000)}</Text>}
          onPress={() => setShipping('express')}
        />
        <Text style={[s.textMutedSmall, { marginTop: 8 }]}>Dự kiến giao: {etaText}</Text>
      </View>

      {/* Phương thức thanh toán */}
      <Section title="Phương thức thanh toán" onEdit={() => setPaymentSheet(true)}>
        <Text style={[s.textMuted, { fontWeight: '600' }]}>
          {paymentMethod === 'vnpay' ? 'VNPAY (QR/Thẻ/ATM)' : 'Thanh toán khi nhận hàng (COD)'}
        </Text>
      </Section>

      {/* Tổng cộng + Thanh toán */}
      <View style={s.totalBar}>
        <View>
          <Text style={s.totalLabel}>Tổng cộng</Text>
          <Text style={s.totalValue}>{formatVND(grandTotal)}</Text>
        </View>
        <TouchableOpacity style={[s.payBtn, !canPay && { opacity: 0.6 }]} onPress={handlePay} disabled={!canPay}>
          <Text style={s.payText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>

      {/* Đang xử lý */}
      <Modal visible={progressing} transparent animationType="fade">
        <View style={s.modalCenter}><View style={s.dialog}>
          <ActivityIndicator size="large" /><Text style={{ marginTop: 12, fontWeight: '700' }}>Đang xử lý thanh toán</Text>
          <Text style={s.textMutedSmall}>Vui lòng chờ trong giây lát…</Text>
        </View></View>
      </Modal>

      {/* WebView cho native */}
      {!IS_WEB && (
        <Modal visible={webVisible} animationType="slide" onRequestClose={() => setWebVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={s.webHeader}>
              <TouchableOpacity onPress={() => { setWebVisible(false); setWebUrl(null); }}>
                <Text style={{ color: '#EF4444', fontWeight: '700' }}>Đóng</Text>
              </TouchableOpacity>
              <Text style={{ fontWeight: '800' }}>VNPAY</Text>
              <View style={{ width: 44, alignItems: 'flex-end' }}>
                {wvLoading && <ActivityIndicator size="small" />}
              </View>
            </View>
            {!!webUrl && (
              <WebView
                source={{ uri: webUrl }}
                onShouldStartLoadWithRequest={onShouldStartLoad}
                onLoadStart={() => setWvLoading(true)}
                onLoadEnd={() => setWvLoading(false)}
                startInLoadingState
                incognito
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
              />
            )}
          </View>
        </Modal>
      )}

      {/* Kết quả */}
      <Modal visible={!!result} transparent animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={s.modalCenter}><View style={s.dialog}>
          <Icon name={result?.ok ? 'check-circle' : 'exclamation-circle'} size={42} color={result?.ok ? '#10B981' : '#EF4444'} />
          <Text style={{ marginTop: 12, fontWeight: '700', textAlign: 'center' }}>{result?.title}</Text>
          <Text style={[s.textMutedSmall, { textAlign: 'center' }]}>{result?.msg}</Text>
          <TouchableOpacity style={[s.applyBtn, { marginTop: 12, alignSelf: 'stretch' }]} onPress={() => {
            setResult(null); if (result?.ok) navigation?.replace?.('OrderTracking' as any);
          }}>
            <Text style={s.applyText}>{result?.ok ? 'Theo dõi đơn hàng' : 'Thử lại'}</Text>
          </TouchableOpacity>
        </View></View>
      </Modal>

      {/* Chọn phương thức thanh toán */}
      <Modal visible={paymentSheet} transparent animationType="slide" onRequestClose={() => setPaymentSheet(false)}>
        <View style={s.bottomSheetBackdrop}>
          <View style={s.bottomSheet}>
            <View style={[s.rowBetween, { marginBottom: 8 }]}>
              <Text style={{ fontWeight: '800', fontSize: 16 }}>Chọn phương thức thanh toán</Text>
              <TouchableOpacity onPress={() => setPaymentSheet(false)}><Icon name="close" size={18} /></TouchableOpacity>
            </View>

            <RadioRow
              checked={paymentMethod === 'vnpay'}
              left={<Text style={s.radioTitle}>VNPAY (QR/Thẻ/ATM)</Text>}
              right={null}
              onPress={() => setPaymentMethod('vnpay')}
            />
            <RadioRow
              checked={paymentMethod === 'CASH'}
              left={<Text style={s.radioTitle}>Thanh toán khi nhận hàng (COD)</Text>}
              right={null}
              onPress={() => setPaymentMethod('CASH')}
            />

            <TouchableOpacity style={[s.applyBtn, { alignSelf: 'flex-end', marginTop: 12 }]} onPress={() => setPaymentSheet(false)}>
              <Text style={s.applyText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Debug log */}
      <Modal visible={debugOpen} animationType="slide" onRequestClose={() => setDebugOpen(false)} transparent>
        <View style={s.debugModalBackdrop}><View style={s.debugModal}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 16 }}>Debug Log</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setLogs([])}><Text style={{ color: '#EF4444', fontWeight: '700' }}>Xóa</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDebugOpen(false)}><Icon name="close" size={18} /></TouchableOpacity>
            </View>
          </View>
          <ScrollView style={{ marginTop: 8 }}>
            {logs.map((l, i) => (<Text key={i} style={{ fontSize: 12, color: '#111', marginBottom: 4 }}>{l}</Text>))}
          </ScrollView>
        </View></View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;

/** UI helpers & styles */
const Section = ({ title, children, onEdit }: any) => (
  <View style={s.card}>
    <View style={s.rowBetween}>
      <Text style={s.title}>{title}</Text>
      {!!onEdit && (<TouchableOpacity onPress={onEdit}><Icon name="edit" size={18} color="#3B82F6" /></TouchableOpacity>)}
    </View>
    <View style={{ marginTop: 6 }}>{children}</View>
  </View>
);
const RadioRow = ({ checked, left, right, onPress }: any) => (
  <TouchableOpacity style={s.radioRow} onPress={onPress}>
    <View style={s.radioLeft}>
      <View style={[s.radioOuter, checked && { borderColor: '#3B82F6' }]}>{checked && <View style={s.radioInner} />}</View>
      <View style={{ marginLeft: 8 }}>{left}</View>
    </View>
    <View>{right}</View>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F7F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' },
  textMuted: { color: '#555', marginTop: 2 },
  textMutedSmall: { color: '#666', fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  itemImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F3F4F6', marginRight: 10 },
  itemName: { fontWeight: '600' },
  itemPrice: { color: '#111', marginTop: 2 },
  qty: { fontWeight: '700' },
  radioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  radioLeft: { flexDirection: 'row', alignItems: 'center' },
  radioTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  radioOuter: { width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#3B82F6' },
  price: { fontWeight: '700' },
  totalBar: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#666' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  payBtn: { backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  payText: { color: '#fff', fontWeight: '700' },

  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '75%', alignItems: 'center' },
  applyBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: '700' },

  webHeader: {
    height: 48, paddingHorizontal: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },

  bottomSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', padding: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },

  debugModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 16, justifyContent: 'flex-end' },
  debugModal: { backgroundColor: '#fff', maxHeight: '80%', padding: 12, borderRadius: 12 },
});
