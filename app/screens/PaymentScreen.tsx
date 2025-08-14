// app/screens/PaymentScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';

import { RootStackParamList } from '..';
import {
  createPaymentOrder,
  getAdminAddressById, // <-- chỉ dùng admin address
  getCartById,
  getOrderDetail,
  getSavedCartId,
  getShippingFee,
  getUserEmail,
} from '../Api/ApiService';
import { useCart } from './context/CartContext';

type ShippingOption = 'standard' | 'express';
type PaymentMethod = 'vnpay' | 'CASH';
type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

// ===== RETURN_URL chuẩn (khớp với backend vnpay) =====
const API_HOST =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
const RETURN_URL = `${API_HOST}/api/payment/vnpay/return`;

// ===== DEBUG helpers =====
const DEBUG = true;
const ts = () => new Date().toISOString().slice(11, 19);

const PaymentScreen = ({ navigation, route }: Props) => {
  const { cartItems, replaceCart, getTotalPrice } = useCart();

  // Debug panel
  const [debugOpen, setDebugOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const safeJson = (v: any) => {
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  const dlog = (msg: string, data?: any) => {
    if (!DEBUG) return;
    const line = `[${ts()}] ${msg}${data !== undefined ? ' ' + safeJson(data) : ''}`;
    console.log('[Payment]', msg, data);
    setLogs(prev => [line, ...prev].slice(0, 300));
  };

  // ids
  const [email, setEmail] = useState<string | null>(route.params?.email ?? null);
  const [cartId, setCartId] = useState<string | number | null>(route.params?.cartId ?? null);

  // loading/init
  const [loading, setLoading] = useState(true);

  // address & contact
  const [address, setAddress] = useState<any>(null);
  const [phone, setPhone] = useState<string>('');

  // shipping
  const [shipping, setShipping] = useState<ShippingOption>('standard');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [etaText, setEtaText] = useState<string>('5–7 days');

  // payment method
  const [paymentSheet, setPaymentSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');

  // dialogs
  const [progressing, setProgressing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; title: string; msg: string } | null>(null);

  // VNPAY
  const [vnpModal, setVnpModal] = useState(false);
  const [vnpUrl, setVnpUrl] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | number | null>(null);

  // totals
  const subtotal = useMemo(() => getTotalPrice(), [cartItems, getTotalPrice]);
  const discount = 0; // ← đã tắt voucher
  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discount + shippingFee),
    [subtotal, discount, shippingFee]
  );

  const formatVND = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;

  /* ---------------- INIT: email/cart/address ---------------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        dlog('INIT_START', { routeParams: route.params, API_HOST, RETURN_URL });

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
            price: Number(x.price ?? x.unitPrice ?? x.specialPrice ?? x.product?.price ?? 0),
            image: x.imageUrl ?? x.image ?? x.product?.imageUrl ?? x.product?.image ?? 'https://via.placeholder.com/100',
            quantity: Number(x.quantity ?? 1),
            cartItemId: x.id ?? x.cartItemId,
          }));
          dlog('CART_REFRESHED', { serverCount: (items || []).length, mappedCount: mapped.length });
          replaceCart(mapped);
        }

        // Lấy địa chỉ admin id=3 — KHÔNG fallback getDefaultAddress để tránh 401
        try {
          const raw = await getAdminAddressById(3);
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
          dlog('ADDRESS_ADMIN_OK', addr);
        } catch (err: any) {
          dlog('ADDRESS_ADMIN_ERR', { status: err?.response?.status, message: err?.message });
          // Không gọi getDefaultAddress nữa -> nếu fail, để address = null để UI báo "Chưa có địa chỉ"
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

  /* ---------------- SHIPPING FEE ---------------- */
  useEffect(() => {
    (async () => {
      try {
        dlog('SHIP_CALC_START', { shipping, subtotal });
        const resp = await getShippingFee(shipping, Math.max(0, subtotal));
        if (resp?.fee != null) setShippingFee(resp.fee);
        setEtaText(resp?.eta || (shipping === 'standard' ? '5–7 days' : '1–2 days'));
        dlog('SHIP_CALC_OK', resp);
      } catch (err) {
        dlog('SHIP_CALC_ERR', err);
        setShippingFee(shipping === 'standard' ? 0 : 12000);
        setEtaText(shipping === 'standard' ? '5–7 days' : '1–2 days');
      }
    })();
  }, [shipping, subtotal]);

  /* ---------------- PAY ---------------- */
  const handlePay = async () => {
    if (!email || !cartId) {
      Alert.alert('Thanh toán', 'Bạn cần đăng nhập để thanh toán.');
      return;
    }
    if (!cartItems?.length) {
      Alert.alert('Giỏ hàng', 'Giỏ hàng trống.');
      return;
    }
    if (!address) {
      Alert.alert('Địa chỉ', 'Vui lòng thêm địa chỉ giao hàng.');
      return;
    }

    try {
      setProgressing(true);

      const items = cartItems.map(it => ({
        productId: Number(it.id),
        quantity: Number(it.quantity),
        price: Number(it.price),
      }));

      const payload = {
        address,
        shippingOption: shipping,
        voucherCode: null,                 // đã tắt voucher
        totals: { subtotal, discount: 0, shippingFee, total: grandTotal },
        amount: grandTotal,
        returnUrl: RETURN_URL,             // dùng cho VNPAY
        items,
      };

      dlog('PAY_START', { email, cartId, paymentMethod, payload });

      const resp = await createPaymentOrder(email, cartId!, paymentMethod, payload);
      dlog('PAY_RESP', resp);
      const orderId = resp?.orderId ?? resp?.id;
      setCurrentOrderId(orderId);

      if (paymentMethod === 'vnpay') {
        const payUrl = resp?.payUrl || resp?.paymentUrl || resp?.vnpUrl;
        if (!payUrl) {
          setResult({ ok: false, title: 'Không khởi tạo được VNPAY', msg: 'Server không trả payUrl.' });
          dlog('VNPAY_NO_URL');
          return;
        }
        setVnpUrl(payUrl);
        setVnpModal(true);
        dlog('VNPAY_OPEN', payUrl);
        return;
      }

      // COD
      setResult({
        ok: true,
        title: 'Đặt hàng thành công',
        msg: `Mã đơn: ${orderId ?? ''}\nBạn sẽ thanh toán khi nhận hàng.`,
      });
      dlog('COD_OK', { orderId });
    } catch (err: any) {
      dlog('PAY_ERR', err?.response?.data || err?.message || err);
      setResult({ ok: false, title: 'Không khởi tạo được thanh toán', msg: 'Vui lòng thử lại.' });
    } finally {
      setProgressing(false);
      dlog('PAY_END');
    }
  };

  const canPay =
    !!email && !!cartId && !!cartItems?.length && !!address && grandTotal > 0;

  const onPressPay = () => {
    dlog('PAY_BTN_PRESS', {
      canPay,
      email,
      cartId,
      items: cartItems?.length ?? 0,
      grandTotal,
      paymentMethod,
    });

    if (!canPay) {
      const reasons = {
        noEmail: !email,
        noCartId: !cartId,
        emptyCart: !(cartItems?.length),
        noAddress: !address,
        zeroTotal: !(grandTotal > 0),
      };
      dlog('PAY_DISABLED_REASONS', reasons);
      Alert.alert(
        'Không thể thanh toán',
        Object.entries(reasons)
          .filter(([, v]) => v)
          .map(([k]) =>
            ({
              noEmail: 'Thiếu email',
              noCartId: 'Thiếu cartId',
              emptyCart: 'Giỏ hàng trống',
              noAddress: 'Chưa có địa chỉ',
              zeroTotal: 'Tổng tiền = 0',
            } as any)[k]
          )
          .join('\n')
      );
      return;
    }

    handlePay();
  };

  /* ---------------- VNPAY WEBVIEW ---------------- */
  const onVnpNavChange = async (event: any) => {
    const url: string | undefined = event?.url || event?.nativeEvent?.url;
    dlog('WEBVIEW_NAV', { url });
    if (!url) return;

    if (url.startsWith(RETURN_URL)) {
      dlog('WEBVIEW_HIT_RETURN_URL');
      setVnpModal(false);
      try {
        if (currentOrderId && email) {
          const detail = await getOrderDetail(email, currentOrderId);
          dlog('ORDER_DETAIL', detail);
          const paid =
            detail?.paymentStatus === 'PAID' ||
            detail?.status === 'PAID' ||
            detail?.orderStatus === 'PAID';

          setResult({
            ok: paid,
            title: paid ? 'Done!' : 'Thanh toán thất bại',
            msg: paid ? 'Thanh toán VNPay thành công.' : 'Vui lòng thử lại.',
          });
          return;
        }
      } catch (e) {
        dlog('ORDER_DETAIL_ERR', e);
      }
      setResult({ ok: false, title: 'Không xác minh được giao dịch', msg: 'Vui lòng kiểm tra đơn hàng.' });
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Đang tải…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Nút mở Debug Log */}
      {/* {DEBUG && (
        <TouchableOpacity style={s.debugFab} onPress={() => setDebugOpen(true)}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>DBG</Text>
        </TouchableOpacity>
      )} */}

      {/* Shipping Address */}
      <Section title="Shipping Address" onEdit={() => Alert.alert('Edit', 'Open Edit Address modal')}>
        <Text style={s.textMuted}>
          {address
            ? `${address.line1 ?? ''}, ${address.city ?? ''}, ${address.state ?? ''}, ${address.country ?? ''} ${address.postalCode ?? ''}`
            : 'Chưa có địa chỉ'}
        </Text>
      </Section>

      {/* Contact */}
      <Section title="Contact Information" onEdit={() => Alert.alert('Edit', 'Open Edit Contact')}>
        {!!email && <Text style={s.textMuted}>{email}</Text>}
        {!!phone && <Text style={s.textMuted}>{phone}</Text>}
      </Section>

      {/* Items */}
      <View style={[s.card, { paddingBottom: 4 }]}>
        <View style={s.rowBetween}>
          <Text style={s.title}>Items</Text>
        </View>

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

      {/* Shipping Options */}
      <View style={s.card}>
        <Text style={s.title}>Shipping Options</Text>

        <RadioRow
          checked={shipping === 'standard'}
          left={<Text style={s.radioTitle}>Standard <Text style={s.textMutedSmall}>5–7 days</Text></Text>}
          right={<Text style={[s.price, { color: '#10B981' }]}>FREE</Text>}
          onPress={() => { dlog('SHIP_SELECT', 'standard'); setShipping('standard'); }}
        />

        <RadioRow
          checked={shipping === 'express'}
          left={<Text style={s.radioTitle}>Express <Text style={s.textMutedSmall}>1–2 days</Text></Text>}
          right={<Text style={s.price}>{formatVND(12000)}</Text>}
          onPress={() => { dlog('SHIP_SELECT', 'express'); setShipping('express'); }}
        />

        <Text style={[s.textMutedSmall, { marginTop: 8 }]}>Delivered on or before: {etaText}</Text>
      </View>

      {/* Payment Method */}
      <Section title="Payment Method" onEdit={() => setPaymentSheet(true)}>
        <Text style={[s.textMuted, { fontWeight: '600' }]}>{paymentMethod === 'vnpay' ? 'VNPAY' : 'Cash on Delivery'}</Text>
      </Section>

      {/* Total + Pay */}
      <View style={s.totalBar}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{formatVND(grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[s.payBtn, !canPay && { opacity: 0.6 }]}
          onPress={onPressPay}
          disabled={!canPay}
        >
          <Text style={s.payText}>Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Method Sheet */}
      <BottomSheet visible={paymentSheet} onClose={() => setPaymentSheet(false)} title="Payment Methods">
        {(['vnpay', 'CASH'] as PaymentMethod[]).map((m) => (
          <RadioRow
            key={m}
            checked={paymentMethod === m}
            left={<Text style={s.radioTitle}>{m === 'vnpay' ? 'VNPAY' : 'Cash on Delivery'}</Text>}
            right={null}
            onPress={() => { dlog('PAYMENT_SELECT', m); setPaymentMethod(m); setPaymentSheet(false); }}
          />
        ))}
      </BottomSheet>

      {/* Processing */}
      <Modal visible={progressing} transparent animationType="fade">
        <View style={s.modalCenter}>
          <View style={s.dialog}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 12, fontWeight: '700' }}>Payment is in progress</Text>
            <Text style={s.textMutedSmall}>Please, wait a few moments</Text>
          </View>
        </View>
      </Modal>

      {/* Result */}
      <Modal visible={!!result} transparent animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={s.modalCenter}>
          <View style={s.dialog}>
            <Icon name={result?.ok ? 'check-circle' : 'exclamation-circle'} size={42} color={result?.ok ? '#10B981' : '#EF4444'} />
            <Text style={{ marginTop: 12, fontWeight: '700', textAlign: 'center' }}>{result?.title}</Text>
            <Text style={[s.textMutedSmall, { textAlign: 'center' }]}>{result?.msg}</Text>
            <TouchableOpacity
              style={[s.applyBtn, { marginTop: 12, alignSelf: 'stretch' }]}
              onPress={() => {
                setResult(null);
                if (result?.ok) navigation?.navigate?.('OrderTracking');
              }}
            >
              <Text style={s.applyText}>{result?.ok ? 'Track My Order' : 'Try Again'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal WebView VNPAY */}
      <Modal visible={vnpModal} animationType="slide" onRequestClose={() => setVnpModal(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', elevation: 2 }}>
          <TouchableOpacity onPress={() => setVnpModal(false)}>
            <Icon name="close" size={20} />
          </TouchableOpacity>
          <Text style={{ marginLeft: 12, fontWeight: '700' }}>VNPAY</Text>
        </View>

        {vnpUrl ? (
          <WebView
            source={{ uri: vnpUrl }}
            onNavigationStateChange={onVnpNavChange}
            onMessage={onVnpNavChange as any}
            onError={(e) => dlog('WEBVIEW_ERROR', { code: e?.nativeEvent?.code, desc: e?.nativeEvent?.description })}
            onHttpError={(e) => dlog('WEBVIEW_HTTP_ERROR', { statusCode: e?.nativeEvent?.statusCode })}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            incognito
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </Modal>

      {/* DEBUG LOG PANEL */}
      <Modal visible={debugOpen} animationType="slide" onRequestClose={() => setDebugOpen(false)} transparent>
        <View style={s.debugModalBackdrop}>
          <View style={s.debugModal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 16 }}>Debug Log</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setLogs([])}>
                  <Text style={{ color: '#EF4444', fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDebugOpen(false)}>
                  <Icon name="close" size={18} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ marginTop: 8 }}>
              {logs.map((l, i) => (
                <Text key={i} style={{ fontSize: 12, color: '#111', marginBottom: 4 }}>
                  {l}
                </Text>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;

/* ---------------- UI helpers ---------------- */
const Section = ({ title, children, onEdit }: any) => (
  <View style={s.card}>
    <View style={s.rowBetween}>
      <Text style={s.title}>{title}</Text>
      {!!onEdit && (
        <TouchableOpacity onPress={onEdit}><Icon name="edit" size={18} color="#3B82F6" /></TouchableOpacity>
      )}
    </View>
    <View style={{ marginTop: 6 }}>{children}</View>
  </View>
);

const RadioRow = ({ checked, left, right, onPress }: any) => (
  <TouchableOpacity style={s.radioRow} onPress={onPress}>
    <View style={s.radioLeft}>
      <View style={[s.radioOuter, checked && { borderColor: '#3B82F6' }]}>
        {checked && <View style={s.radioInner} />}
      </View>
      <View style={{ marginLeft: 8 }}>{left}</View>
    </View>
    <View>{right}</View>
  </TouchableOpacity>
);

const BottomSheet = ({ visible, onClose, title, children }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.sheetBackdrop} onPress={onClose} />
    <View style={s.sheet}>
      <View style={s.sheetHeader}>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>{title}</Text>
        <TouchableOpacity onPress={onClose}><Icon name="close" size={18} /></TouchableOpacity>
      </View>
      <View>{children}</View>
    </View>
  </Modal>
);

/* ---------------- STYLES ---------------- */
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

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12, maxHeight: '70%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },

  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '75%', alignItems: 'center' },

  applyBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: '700' },

  // Debug UI
  debugFab: { position: 'absolute', right: 14, top: 14, zIndex: 10, backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  debugModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 16, justifyContent: 'flex-end' },
  debugModal: { backgroundColor: '#fff', maxHeight: '80%', padding: 12, borderRadius: 12 },
});
