// ApiService.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { Platform } from 'react-native';

/**
 * ============================================
 *           CẤU HÌNH CƠ BẢN
 * ============================================
 * LƯU Ý: nếu chạy trên thiết bị thật, KHÔNG dùng localhost.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8080/api';

/**
 * Hàm tiện lấy URL chuẩn cho mọi fetch thủ công ngoài axios
 */
export function getApiUrl(path: string) {
  return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** Key lưu trữ trong AsyncStorage */
const AS_KEY_TOKEN = 'jwt-token';
const AS_KEY_EMAIL = 'user-email';
const AS_KEY_USER_INFO = 'user-info';
const AS_KEY_CART_ID = 'cart-id';

/**
 * ============================================
 *           AXIOS INSTANCE + INTERCEPTOR
 * ============================================
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn token chuẩn "Bearer ..."
api.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem(AS_KEY_TOKEN);
  if (raw) {
    const t = raw.trim();
    const headerToken = t.toLowerCase().startsWith('bearer ') ? t : `Bearer ${t}`;
    if (!config.headers) config.headers = new AxiosHeaders();
    (config.headers as AxiosHeaders).set('Authorization', headerToken);
  }
  return config;
});

// (Tuỳ chọn) bắt 401 để log rõ ràng hơn
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — có thể token thiếu/hết hạn');
    }
    return Promise.reject(error);
  }
);

/** Log lỗi chuẩn cho mọi request */
function logAxiosError(method: string, endpoint: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;
    console.error(
      `API ${method.toUpperCase()} ${endpoint} thất bại:`,
      err.response?.data || err.message
    );
  } else {
    console.error(`API ${method.toUpperCase()} ${endpoint} thất bại:`, error);
  }
}

/**
 * ============================================
 *           HÀM GỌI API TỔNG QUÁT
 * ============================================
 */
async function callApi<T = any>(
  endpoint: string,
  method: AxiosRequestConfig['method'],
  data?: any
): Promise<AxiosResponse<T>> {
  try {
    // Log token trước khi gọi API
    const rawToken = await AsyncStorage.getItem(AS_KEY_TOKEN);
  // ...DEBUG log đã bị tắt...
    const res = await api.request<T>({ url: `/${endpoint}`, method, data });
    return res;
  } catch (error) {
    logAxiosError(method || 'GET', endpoint, error);
    throw error;
  }
}

/** ================== CRUD NGẮN GỌN ================== */
export const GET_ALL = <T = any>(endpoint: string) => callApi<T>(endpoint, 'GET');
export const GET_ID =  <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'GET');
export const GET_IMAGE = <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'GET');
export const GET_PAGE = <T = any>(
  endpoint: string,
  page: number = 0,
  size: number = 10,
  categoryId: string | null = null
) => {
  let url = `${endpoint}?page=${page}&size=${size}`;
  if (categoryId) url += `&categoryId=${categoryId}`;
  return callApi<T>(url, 'GET');
};
export const POST =  <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'POST', data);
export const PUT =   <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'PUT', data);
export const PATCH = <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'PATCH', data);
export const DELETE_ID = <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'DELETE');

/**
 * ============================================
 *           AUTH + USER HELPERS
 * ============================================
 */
export async function saveUserEmail(email: string) {
  try {
    await AsyncStorage.setItem(AS_KEY_EMAIL, email);
  } catch (e) {
    console.error('Lỗi lưu email:', e);
  }
}

export async function getUserEmail() {
  try {
    return await AsyncStorage.getItem(AS_KEY_EMAIL);
  } catch {
    return null;
  }
}

export async function saveCartId(cartId: string | number) {
  try {
    await AsyncStorage.setItem(AS_KEY_CART_ID, String(cartId));
  } catch (e) {
    console.error('Lỗi lưu cart-id:', e);
  }
}

export async function getSavedCartId() {
  try {
    return await AsyncStorage.getItem(AS_KEY_CART_ID);
  } catch {
    return null;
  }
}

/** (Tiện) Lấy trạng thái đăng nhập hiện tại */
export async function getAuthState() {
  const [email, token] = await Promise.all([
    AsyncStorage.getItem(AS_KEY_EMAIL),
    AsyncStorage.getItem(AS_KEY_TOKEN),
  ]);
  return { email, token };
}

/** Đăng ký (ví dụ) */
export const registerUser = async (username: string, password: string) => {
  const response = await POST('auth/register', { username, password });
  return response.data;
};

/** Lấy user info theo email */
export async function getUserInfoByEmail(email: string) {
  try {
    const res = await GET_ALL(`public/users/email/${email}`);
    const userInfo = res.data;
    // Nếu có cartId thì trả về kèm luôn
    const cartId = userInfo?.cart?.cartId ?? null;
    return { userInfo, cartId };
  } catch {
    return null;
  }
}

/** Lấy profile user (dựa theo email đã lưu) */
export async function getUserProfile() {
  try {
    const email = await AsyncStorage.getItem(AS_KEY_EMAIL);
    if (!email) return null;
    const res = await GET_ALL(`public/users/email/${email}`);
    return res.data;
  } catch {
    return null;
  }
}

/** Đăng nhập
 *  - Xoá token cũ
 *  - POST login
 *  - Lưu token (giữ nguyên format), interceptor sẽ tự thêm/không thêm 'Bearer'
 *  - Lưu email
 *  - Prefetch carts và lưu cart-id đầu
 *  - Lưu user-info
 */
export const loginUser = async (email: string, password: string) => {
  await AsyncStorage.removeItem(AS_KEY_TOKEN);

  const response = await POST<any>('login', { email, password });

  const possible =
    response.data?.[AS_KEY_TOKEN] ||
    response.data?.token ||
    response.data?.accessToken ||
    response.data?.access_token ||
    '';

  const t = String(possible).trim();
  if (t) {
    await AsyncStorage.setItem(AS_KEY_TOKEN, t);
  } else {
    await AsyncStorage.removeItem(AS_KEY_TOKEN);
  }

  await AsyncStorage.setItem(AS_KEY_EMAIL, email);

  try {
    const result = await getUserInfoByEmail(email);
    await AsyncStorage.setItem(AS_KEY_USER_INFO, JSON.stringify(result?.userInfo || response.data));
    // prefetch cart id mới
    if (result && result.cartId) {
      await saveCartId(result.cartId);
    }
  } catch {
    await AsyncStorage.setItem(AS_KEY_USER_INFO, JSON.stringify(response.data));
  }

  return response.data;
};

/** Lấy userId đã lưu (nếu backend có field này) */
export async function getUserId() {
  try {
    const userInfo = await AsyncStorage.getItem(AS_KEY_USER_INFO);
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.userId || user.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ============================================
 *           CART THEO EMAIL / CART ID
 * ============================================
 */



/**
 * Thêm sản phẩm vào cart theo cartId (chuẩn backend)
 * - cartId: lấy từ getCartIdByEmail
 */
export function addProductToCart(cartId: string | number, productId: number, quantity: number) {
  // ...DEBUG log đã bị tắt...
  return POST(`public/carts/${cartId}/products/${productId}/quantity/${quantity}`, {});
}

/**
 * Lấy cartId đầu tiên của user theo email (chuẩn backend mới)
 * - B1: Lấy user info qua /public/users/email/{email}
 * - B2: Lấy cartId từ userInfo.cart.cartId
 */
export async function getCartIdByEmail(email: string): Promise<string | number | null> {
  try {
    const result = await getUserInfoByEmail(email);
    if (result && result.cartId) {
      return result.cartId;
    }
    return null;
  } catch (e) {
  // ...DEBUG log đã bị tắt...
    return null;
  }
}


// Update số lượng theo cartItemId (nếu backend hỗ trợ)
export async function updateCartItemQtyById(
  cartId: string | number,
  productId: number | string,
  quantity: number
) {
  const res = await callApi(
    `public/carts/${cartId}/product/${productId}/quantity/${quantity}`,
    'PUT'
  );
  return res?.data;
}


// Xoá 1 item theo cartItemId (ưu tiên)
export async function removeProductFromCart(
  cartId: string | number,
  productId: number | string
) {
  const res = await callApi(
    `public/carts/${cartId}/product/${productId}`,
    'DELETE'
  );
  return res?.data;
}

export async function getCartById(email: string, cartId: string | number) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/carts/${cartId}`);
  return res.data; // backend trả về { items: [...] }
}


// (tuỳ chọn) nếu ở nơi nào đó bạn bắt buộc phải dùng fetch:
export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem('jwt-token');
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}` } : {}),
  } as any;
  return fetch(getApiUrl(path), { ...init, headers });
}



/**
 * ============================================
 *           PRODUCTS & CATEGORIES
 * ============================================
 */
export const getAllProducts = async () => {
  const response = await GET_ALL('public/products?pageNumber=0&pageSize=20&sortBy=productId&sortOrder=asc');
  return response.data?.content ?? response.data ?? [];
};

export const getProductById = async (productId: number) => {
  const response = await GET_ID('public/products', productId);
  return response.data;
};

export const getAllCategoriesWithProducts = async () => {
  try {
    const catResponse = await GET_ALL('public/categories');
    const categories = catResponse.data?.content ?? catResponse.data ?? [];

    const categoriesWithProducts = await Promise.all(
      categories.map(async (cat: any) => {
        try {
          const productResponse = await GET_ALL(`public/categories/${cat.categoryId}/products`);
          const productsRaw = productResponse.data?.content ?? productResponse.data ?? [];
          const topProducts = [...productsRaw]
            .filter((p) => typeof p.specialPrice === 'number')
            .sort((a, b) => a.specialPrice - b.specialPrice)
            .slice(0, 4);

          return { ...cat, productCount: productsRaw.length, products: topProducts };
        } catch (error) {
          console.error(`Lỗi lấy sản phẩm của category ${cat.categoryId}:`, error);
          return { ...cat, productCount: 0, products: [] };
        }
      })
    );

    return categoriesWithProducts;
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return [];
  }
};

export const getFlashSaleProducts = async () => {
  const response = await GET_ALL('public/products');
  const allProducts = response.data?.content ?? response.data ?? [];
  const flashSaleProducts = allProducts.filter((product: any) => {
    return (
      (typeof product.discount === 'number' && product.discount > 0) ||
      (typeof product.specialPrice === 'number' &&
        product.specialPrice > 0 &&
        product.specialPrice < product.price)
    );
  });
  return flashSaleProducts;
};

/* ================== CHECKOUT APIs ================== */

// Lấy/cập nhật địa chỉ giao hàng mặc định theo email (tùy backend của bạn)
export async function getDefaultAddress(email: string) {
  // ví dụ: /public/users/{email}/address/default
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/address/default`);
  return res.data; // { fullName, phone, line1, city, state, country, postalCode }
}

export async function getActiveVouchers(email: string) {
  // ví dụ: /public/users/{email}/vouchers/active
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/vouchers/active`);
  return res.data ?? []; // [{code, name, percent, expiresAt}, ...]
}

export async function checkVoucher(email: string, cartId: string|number, code: string) {
  // ví dụ: /public/users/{email}/carts/{cartId}/voucher/{code}
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/carts/${cartId}/voucher/${encodeURIComponent(code)}`);
  return res.data; // { valid: true/false, name, percent, amountOff }
}

export async function getShippingFee(option: 'standard'|'express', subtotal: number) {
  // ví dụ: miễn phí standard, express = 12000
  // Nếu có API thực, thay dòng dưới bằng GET_ALL/POST
  const fee = option === 'standard' ? 0 : 12000;
  const eta = option === 'standard' ? '5–7 days' : '1–2 days';
  return { fee, eta };
}

export async function createOrder(payload: {
  email: string;
  cartId: string|number;
  address: any;
  items: Array<{ productId: number; quantity: number; price: number }>;
  shippingOption: 'standard'|'express';
  voucherCode?: string|null;
  paymentMethod: 'card'|'cod'|'wallet';
  note?: string;
  totals: { subtotal: number; discount: number; shippingFee: number; total: number };
}) {
  // ví dụ: POST /orders
  const res = await POST<any>('orders', payload);
  return res.data; // { orderId, status, ... }
}

export async function payOrder(orderId: number|string, method: 'card'|'wallet') {
  // ví dụ: POST /orders/{orderId}/pay
  const res = await POST<any>(`orders/${orderId}/pay`, { method });
  return res.data; // { status: 'PAID' }
}

// (tuỳ chọn) danh sách đơn của user
export async function getOrdersOfUser(email: string) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/orders`);
  return res.data;
}


// /** Tạo order & khởi tạo thanh toán (vnpay | cod) */
// export async function createPaymentOrder(
//   email: string,
//   cartId: string | number,
//   paymentMethod: 'vnpay' | 'cod',
//   payload: any = {}
// ) {
//   const safeEmail = encodeURIComponent(email);
//   const res = await POST<any>(
//     `public/users/${safeEmail}/carts/${cartId}/payments/${paymentMethod}/order`,
//     payload
//   );
//   return res.data; // kỳ vọng { orderId, payUrl? }
// }

/** Lấy chi tiết order để kiểm tra trạng thái sau redirect VNPAY */
export async function getOrderDetail(email: string, orderId: string | number) {
  const safeEmail = encodeURIComponent(email);
  const res = await GET_ALL<any>(`public/users/${safeEmail}/orders/${orderId}`);
  return res.data;
}


const API =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:8000');

// nếu backend yêu cầu JWT
const authHeader = async () => {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('jwt-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

// ApiService.tsx
export async function createPaymentOrder(
  email: string,
  cartId: string | number,
  method: 'vnpay' | 'CASH',
  body: {
    address?: any;
    shippingOption?: string;
    voucherCode?: string | null;
    totals?: any;
    amount: number;
    returnUrl?: string; // chỉ cần cho vnpay
    items?: Array<{ productId: number; quantity: number; price: number }>;
  }
) {
  const safeEmail = encodeURIComponent(email);

  // đảm bảo amount là số nguyên (nhiều BE yêu cầu int VND)
  const payload = {
    address: body.address ?? null,
    shippingOption: body.shippingOption ?? 'standard',
    voucherCode: body.voucherCode ?? null,
    totals: body.totals ?? null,
    amount: Math.max(0, Math.round(Number(body.amount || 0))),
    returnUrl: body.returnUrl,
    items: body.items ?? [],
  };

  try {
    // baseURL đã là http(s)://...:8080/api
    const path = `/public/users/${safeEmail}/carts/${cartId}/payments/${method}/order`;
    console.log('[createPaymentOrder] POST', api.defaults.baseURL + path, payload);
    const res = await api.post(path, payload);   // <-- dùng instance `api`
    return res.data; // { orderId, payUrl? ... }
  } catch (e: any) {
    if (axios.isAxiosError(e)) {
      console.warn('[createPaymentOrder] ERR', e.response?.status, e.response?.data || e.message);
    }
    throw e;
  }
}

// ===== LẤY ĐỊA CHỈ ADMIN THEO ID =====
export const getAdminAddressById = async (id: number) => {
  const url = `${API_URL}/admin/addresses/${id}`;

  const headers = {
    Accept: 'application/json',
    ...(await authHeader()),        // ✅ dùng đúng tên, có await nếu trả về Promise
  };

  const resp = await axios.get(url, {
    headers,
    maxRedirects: 0,
    validateStatus: (s) => s === 200 || s === 302, // chấp nhận 302 từ BE
  });

  return resp.data;
};