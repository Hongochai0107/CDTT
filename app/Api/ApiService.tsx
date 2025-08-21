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
import { Product } from '../index';

/* ===================== CONFIG ===================== */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api');

export const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL?.trim() ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8082/api' : 'http://localhost:8082/api');

export function getApiUrl(path: string) {
  return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export const imgUrl = (fileName?: string) =>
  fileName ? getApiUrl(`/public/products/image/${fileName}`) : undefined;

/** Keys in AsyncStorage */
const AS_KEY_TOKEN = 'jwt-token';
const AS_KEY_EMAIL = 'user-email';
const AS_KEY_USER_INFO = 'user-info';
const AS_KEY_CART_ID = 'cart-id';

/* ========== AXIOS INSTANCE + INTERCEPTORS ========== */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

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

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — token thiếu/hết hạn');
    }
    return Promise.reject(error);
  }
);

function logAxiosError(method: string, endpoint: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;
    console.error(`API ${method.toUpperCase()} ${endpoint} thất bại:`, err.response?.data || err.message);
  } else {
    console.error(`API ${method.toUpperCase()} ${endpoint} thất bại:`, error);
  }
}

/* ================ GENERIC CALLERS ================ */
async function callApi<T = any>(
  endpoint: string,
  method: AxiosRequestConfig['method'],
  data?: any
): Promise<AxiosResponse<T>> {
  try {
    const res = await api.request<T>({ url: `/${endpoint}`, method, data });
    return res;
  } catch (error) {
    logAxiosError(method || 'GET', endpoint, error);
    throw error;
  }
}

export const GET_ALL   = <T = any>(endpoint: string) => callApi<T>(endpoint, 'GET');
export const GET_ID    = <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'GET');
export const GET_IMAGE = <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'GET');
export const GET_PAGE  = <T = any>(endpoint: string, page = 0, size = 10, categoryId: string | null = null) => {
  let url = `${endpoint}?page=${page}&size=${size}`;
  if (categoryId) url += `&categoryId=${categoryId}`;
  return callApi<T>(url, 'GET');
};
export const POST      = <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'POST', data);
export const PUT       = <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'PUT', data);
export const PATCH     = <T = any>(endpoint: string, data: any) => callApi<T>(endpoint, 'PATCH', data);
export const DELETE_ID = <T = any>(endpoint: string, id: string | number) => callApi<T>(`${endpoint}/${id}`, 'DELETE');

/* ================== AUTH HELPERS ================== */
export async function saveUserEmail(email: string) {
  try { await AsyncStorage.setItem(AS_KEY_EMAIL, email); } catch (e) { console.error('Lưu email lỗi:', e); }
}
export async function getUserEmail() {
  try { return await AsyncStorage.getItem(AS_KEY_EMAIL); } catch { return null; }
}
export async function saveCartId(cartId: string | number) {
  try { await AsyncStorage.setItem(AS_KEY_CART_ID, String(cartId)); } catch (e) { console.error('Lưu cart-id lỗi:', e); }
}
export async function getSavedCartId() {
  try { return await AsyncStorage.getItem(AS_KEY_CART_ID); } catch { return null; }
}

/** Lấy trạng thái đăng nhập hiện tại */
export async function getAuthState() {
  const [email, token] = await Promise.all([
    AsyncStorage.getItem(AS_KEY_EMAIL),
    AsyncStorage.getItem(AS_KEY_TOKEN),
  ]);
  return { email, token };
}

/** Header Authorization (dùng cho axios thủ công) */
const authHeader = async () => {
  try {
    const token = await AsyncStorage.getItem(AS_KEY_TOKEN);
    return token
      ? { Authorization: token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}` }
      : {};
  } catch {
    return {};
  }
};

export type Role = { roleId: number; roleName: string };
export type Address = {
  addressId?: number;
  street: string;
  buildingName?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export interface RegisterUserData {
  userId?: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  password: string;
  roles: Role[];
  address: Address;
}

export async function registerUser(userData: RegisterUserData): Promise<boolean> {
  try {
    const res = await POST('register', userData);
    const data = res?.data ?? {};
    const token = data['jwt-token'] || data.token || data.accessToken || data.access_token || null;
    if (token) await AsyncStorage.setItem(AS_KEY_TOKEN, String(token));
    await AsyncStorage.setItem(AS_KEY_EMAIL, userData.email);
    return true;
  } catch (error: any) {
    if (error?.response) console.error('[REGISTER]', error.response.status, error.response.data);
    else console.error('[REGISTER] error:', error?.message);
    return false;
  }
}

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
  if (t) await AsyncStorage.setItem(AS_KEY_TOKEN, t);
  else await AsyncStorage.removeItem(AS_KEY_TOKEN);

  await AsyncStorage.setItem(AS_KEY_EMAIL, email);

  try {
    const result = await getUserInfoByEmail(email);
    await AsyncStorage.setItem(AS_KEY_USER_INFO, JSON.stringify(result?.userInfo || response.data));
    if (result?.cartId) await saveCartId(result.cartId);
  } catch {
    await AsyncStorage.setItem(AS_KEY_USER_INFO, JSON.stringify(response.data));
  }
  return response.data;
};

export async function getUserInfoByEmail(email: string) {
  try {
    const res = await GET_ALL(`public/users/email/${email}`);
    const userInfo = res.data;
    const cartId = userInfo?.cart?.cartId ?? null;
    return { userInfo, cartId };
  } catch { return null; }
}

export async function getUserProfile() {
  try {
    const email = await AsyncStorage.getItem(AS_KEY_EMAIL);
    if (!email) return null;
    const res = await GET_ALL(`public/users/email/${email}`);
    return res.data;
  } catch { return null; }
}

export async function getUserId() {
  try {
    const s = await AsyncStorage.getItem(AS_KEY_USER_INFO);
    if (s) {
      const u = JSON.parse(s);
      return u.userId || u.id || null;
    }
    return null;
  } catch { return null; }
}

export const clearAuthHeader = () => {
  try { delete axios.defaults.headers.common.Authorization; } catch {}
  try { delete (api as any).defaults.headers.common.Authorization; } catch {}
};
export const setAuthHeader = (token?: string) => {
  if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete axios.defaults.headers.common.Authorization;
};

/* ================ CART / ORDERS ================ */
export function addProductToCart(cartId: string | number, productId: number, quantity: number) {
  return POST(`public/carts/${cartId}/products/${productId}/quantity/${quantity}`, {});
}
export async function getCartIdByEmail(email: string) {
  try { const r = await getUserInfoByEmail(email); return r?.cartId ?? null; } catch { return null; }
}
export async function updateCartItemQtyById(cartId: string | number, productId: number | string, quantity: number) {
  const res = await callApi(`public/carts/${cartId}/product/${productId}/quantity/${quantity}`, 'PUT');
  return res?.data;
}
export async function removeProductFromCart(cartId: string | number, productId: number | string) {
  const res = await callApi(`public/carts/${cartId}/product/${productId}`, 'DELETE');
  return res?.data;
}
export async function getCartById(email: string, cartId: string | number) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/carts/${cartId}`);
  return res.data;
}
export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem(AS_KEY_TOKEN);
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}` } : {}),
  } as any;
  return fetch(getApiUrl(path), { ...init, headers });
}

/* ========== PRODUCTS & CATEGORIES (giữ) ========== */
export const getAllProducts = async () => {
  const response = await GET_ALL('public/products?pageNumber=0&pageSize=20&sortBy=productId&sortOrder=asc');
  return response.data?.content ?? response.data ?? [];
};
export const getProductById = async (productId: number) => (await GET_ID('public/products', productId)).data;

export const getAllCategoriesWithProducts = async () => {
  try {
    const catResponse = await GET_ALL('public/categories?pageNumber=0&pageSize=10&sortBy=categoryId&sortOrder=asc');
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
        } catch {
          return { ...cat, productCount: 0, products: [] };
        }
      })
    );
    return categoriesWithProducts;
  } catch {
    return [];
  }
};

export const getFlashSaleProducts = async () => {
  const response = await GET_ALL('public/products');
  const allProducts = response.data?.content ?? response.data ?? [];
  return allProducts.filter((p: any) =>
    (typeof p.discount === 'number' && p.discount > 0) ||
    (typeof p.specialPrice === 'number' && p.specialPrice > 0 && p.specialPrice < p.price)
  );
};

/* ================== CHECKOUT APIs ================== */
export async function getDefaultAddress(email: string) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/address/default`);
  return res.data;
}
export async function getActiveVouchers(email: string) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/vouchers/active`);
  return res.data ?? [];
}
export async function checkVoucher(email: string, cartId: string|number, code: string) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/carts/${cartId}/voucher/${encodeURIComponent(code)}`);
  return res.data;
}
export async function getShippingFee(option: 'standard'|'express', _subtotal: number) {
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
  return (await POST<any>('orders', payload)).data;
}
export async function payOrder(orderId: number|string, method: 'card'|'wallet') {
  return (await POST<any>(`orders/${orderId}/pay`, { method })).data;
}
export async function getOrdersOfUser(email: string) {
  return (await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/orders`)).data;
}
export async function listUserOrders(email: string) {
  const res = await GET_ALL(`public/users/${encodeURIComponent(email)}/orders`);
  return Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
}
export async function adminUpdateOrderStatus(email: string, orderId: string | number, orderStatus: string) {
  return (await PUT(
    `admin/users/${encodeURIComponent(email)}/orders/${encodeURIComponent(String(orderId))}/orderStatus/${encodeURIComponent(orderStatus)}`,
    {}
  )).data;
}
export async function getOrderDetail(email: string, orderId: string | number) {
  const res = await GET_ALL<any>(`public/users/${encodeURIComponent(email)}/orders/${orderId}`);
  return res.data;
}

/* ================== VNPay (Flow B) ================== */
export const VNPAY_HOST =
  process.env.EXPO_PUBLIC_VNPAY_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export async function createVnpayIntent(params: {
  email: string; cartId: string | number;
  amount: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
  returnUrl: string;
  bankCode?: string; locale?: 'vn' | 'en';
}) {
  const { email, cartId, ...body } = params;
  const url = `${VNPAY_HOST}/api/public/users/${encodeURIComponent(email)}/carts/${cartId}/payments/vnpay/order`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Create VNPAY intent failed: ${res.status} ${await res.text().catch(()=> '')}`);
  return res.json() as Promise<{ orderId: string; status: 'PENDING'|'PAID'|'FAILED'; payUrl?: string }>;
}

export async function getVnpIntentStatus(orderId: string | number) {
  const r = await fetch(`${VNPAY_HOST}/api/orders/${orderId}`, { method: 'GET' });
  if (!r.ok) throw new Error(`Get intent status failed: ${r.status}`);
  return r.json() as Promise<{ amount: number; status: 'PENDING'|'PAID'|'FAILED'; email?: string; cartId?: string }>;
}

export async function finalizePaidOrder(
  email: string,
  cartId: string | number,
  payload: {
    address: any;
    shippingOption: 'standard' | 'express';
    voucherCode?: string | null;
    totals: { subtotal: number; discount: number; shippingFee: number; total: number };
    items: Array<{ productId: number; quantity: number; price: number }>;
    intentId: string | number;
  }
) {
  const url = `${API_URL}/public/users/${encodeURIComponent(email)}/carts/${cartId}/checkout?method=VNPAY`;
  const headers = await authHeader();
  const res = await axios.post(url, { ...payload, paymentStatus: 'PAID' }, { headers });
  return res.data;
}

/* ========== ADMIN ADDRESS (Fixed 302-with-body) ========== */
export function normalizeServerAddress(raw: any) {
  return {
    line1: raw?.street || raw?.line1 || raw?.addressLine1 || raw?.detail || '',
    city: raw?.city || '',
    state: raw?.state || raw?.province || raw?.district || '',
    country: raw?.country || 'VN',
    postalCode: raw?.zipCode || raw?.postalCode || raw?.pincode || '',
    phone: raw?.phone || raw?.mobile || '',
    fullName: raw?.fullName || raw?.receiverName || '',
  };
}

/** GET /admin/addresses
 *  - 200: trả body
 *  - 302 + Location: follow
 *  - 302 **không** Location nhưng **có body**: dùng luôn body
 */
export async function getAdminAddress() {
  const url = `${API_URL}/admin/addresses`;
  const headers = { Accept: 'application/json', ...(await authHeader()) };

  const resp = await axios.get(url, {
    headers,
    maxRedirects: 0,
    validateStatus: (s) => s === 200 || s === 302,
  });

  if (resp.status === 200) {
    const data = resp.data;
    return Array.isArray(data) ? data[0] : data;
  }

  // 302
  const loc = resp.headers?.location || (resp.headers as any)?.Location;
  if (loc) {
    const resp2 = await axios.get(loc, { headers });
    const data2 = resp2.data;
    return Array.isArray(data2) ? data2[0] : data2;
  }

  // 302 nhưng có body (kiểu BE của bạn)
  const data = resp.data;
  if (data && (Array.isArray(data) ? data.length : Object.keys(data || {}).length)) {
    return Array.isArray(data) ? data[0] : data;
  }

  throw new Error('Redirect 302 nhưng không có Location và không có data');
}

/** GET /admin/addresses/{id} – xử lý tương tự */
export async function getAdminAddressById(id: number | string) {
  const url = `${API_URL}/admin/addresses/${id}`;
  const headers = { Accept: 'application/json', ...(await authHeader()) };

  const resp = await axios.get(url, {
    headers,
    maxRedirects: 0,
    validateStatus: (s) => s === 200 || s === 302,
  });

  if (resp.status === 200) return resp.data;

  const loc = resp.headers?.location || (resp.headers as any)?.Location;
  if (loc) {
    const resp2 = await axios.get(loc, { headers });
    return resp2.data;
  }

  // 302 nhưng body có sẵn
  if (resp.data && (typeof resp.data === 'object')) return resp.data;

  throw new Error('Redirect 302 nhưng không có Location và không có data');
}

/* ================== AI CHAT (giữ) ================== */
export const aiApi = axios.create({ baseURL: AI_URL });
export const AI_POST = (url: string, data?: any) => aiApi.post(url, data);

const mockCategories = [
  { categoryId: 1, name: 'Áo', keywords: ['áo', 'áo thun', 'áo sơ mi'] },
  { categoryId: 2, name: 'Quần', keywords: ['quần', 'jeans', 'quần short'] },
  { categoryId: 3, name: 'Giày', keywords: ['giày', 'giày thể thao', 'sneaker'] },
  { categoryId: 4, name: 'Túi', keywords: ['túi', 'túi xách', 'balo'] },
  { categoryId: 5, name: 'Phụ kiện', keywords: ['đồng hồ', 'tai nghe', 'phụ kiện'] },
];

const mockProducts: Product[] = [
  { productId: 1, productName: 'Áo thun nam cổ tròn', price: 150000, image: 'ao-thun-nam.jpg', categoryId: 1 },
  { productId: 2, productName: 'Áo sơ mi nữ dài tay', price: 250000, image: 'ao-so-mi-nu.jpg', categoryId: 1 },
  { productId: 3, productName: 'Quần jeans nam slimfit', price: 350000, image: 'quan-jeans-nam.jpg', categoryId: 2 },
  { productId: 4, productName: 'Giày thể thao trắng', price: 500000, image: 'giay-the-thao.jpg', categoryId: 3 },
  { productId: 5, productName: 'Túi xách da nữ', price: 450000, image: 'tui-xach-nu.jpg', categoryId: 4 },
  { productId: 6, productName: 'Đồng hồ thông minh', price: 1200000, image: 'dong-ho-thong-minh.jpg', categoryId: 5 },
];

const mockChatResponse = (messages: Array<{ role: string; content: string }>): string => {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  if (lastMessage.includes('giảm giá') || lastMessage.includes('khuyến mãi')) {
    return 'Hiện tại có chương trình giảm giá: Áo thun giảm 20%, Quần jeans giảm 15%, Giày thể thao giảm 10%. Bạn muốn xem chi tiết sản phẩm nào?';
  }
  if (lastMessage.includes('sản phẩm') || lastMessage.includes('mua gì')) {
    return 'Mình gợi ý một số sản phẩm hot: Áo thun nam, Quần jeans slimfit, Đồng hồ thông minh. Bạn thích loại nào?';
  }
  const matchedCategory = mockCategories.find((cat) => cat.keywords.some((keyword) => lastMessage.includes(keyword)));
  if (matchedCategory) return `Mình tìm thấy một số sản phẩm trong danh mục "${matchedCategory.name}". Xem danh sách bên dưới nhé!`;
  if (lastMessage.includes('giỏ hàng') || lastMessage.includes('cart')) return 'Bạn muốn kiểm tra giỏ hàng hay thêm sản phẩm vào giỏ?';
  if (lastMessage.includes('đặt hàng') || lastMessage.includes('order')) return 'Để đặt hàng, bạn hãy chọn sản phẩm và cung cấp địa chỉ giao hàng. Mình có thể gợi ý sản phẩm nếu bạn muốn!';
  return 'Mình là trợ lý mua sắm, có thể gợi ý sản phẩm, kiểm tra giỏ hàng, hoặc giải đáp thắc mắc. Bạn cần giúp gì?';
};

export async function searchProducts(query: string, useMock: boolean): Promise<Product[]> {
  if (!query?.trim()) throw new Error('Từ khóa tìm kiếm không được để trống');

  if (useMock) {
    await new Promise((r) => setTimeout(r, 1000));
    const lower = query.toLowerCase();
    const matchedCategory = mockCategories.find((cat) => cat.keywords.some((k) => lower.includes(k)));
    const filtered = mockProducts.filter(
      (p) => p.productName.toLowerCase().includes(lower) || (matchedCategory && p.categoryId === matchedCategory.categoryId)
    );
    if (!filtered.length) throw new Error('Không tìm thấy sản phẩm nào phù hợp');
    return filtered.slice(0, 5);
  }

  try {
    const res = await GET_ALL(`public/products/keyword/${encodeURIComponent(query.trim())}`);
    const rawList = Array.isArray(res.data) ? res.data : res.data?.content ?? res.data?.items ?? [];
    if (!rawList.length) throw new Error('Không tìm thấy sản phẩm nào phù hợp');
    return rawList.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.name || '(Không có tên)',
      price: Number(item.price) || 0,
      image: item.image,
      categoryId: item.categoryId,
    })) as Product[];
  } catch (error) {
    logAxiosError('GET', `public/products/keyword/${query}`, error);
    throw error;
  }
}

export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  useMock: boolean = false
): Promise<{ reply: string; products?: Product[] }> {
  if (!messages?.length) throw new Error('Danh sách tin nhắn không được để trống');

  const last = messages[messages.length - 1]?.content.toLowerCase() || '';
  const isSearchQuery =
    mockCategories.some((cat) => cat.keywords.some((k) => last.includes(k))) || last.includes('sản phẩm');

  if (useMock) {
    await new Promise((r) => setTimeout(r, 1000));
    const reply = mockChatResponse(messages);
    if (isSearchQuery) {
      try {
        const products = await searchProducts(last, true);
        return { reply, products: products.length ? products : undefined };
      } catch {
        return { reply: `${reply} (Không tìm thấy sản phẩm phù hợp)` };
      }
    }
    return { reply };
  }

  try {
    const res = await axios.post(`${AI_URL}/public/ai/chat`, { messages });
    const reply = typeof res.data === 'string'
      ? res.data
      : res.data?.reply || res.data?.content || res.data?.message || '[Không có nội dung trả về]';

    if (isSearchQuery) {
      try {
        const products = await searchProducts(last, false);
        return { reply, products: products.length ? products : undefined };
      } catch {
        return { reply: `${reply} (Không tìm thấy sản phẩm phù hợp)` };
      }
    }
    return { reply };
  } catch (error) {
    logAxiosError('POST', 'public/ai/chat', error);
    throw error instanceof Error ? error : new Error('Lỗi không xác định từ API');
  }
}

export async function forgotPassword(email: string): Promise<string> {
  try {
    const res = await axios.post(`${VNPAY_HOST}/forgot-password`, { email }, {
      headers: { "Content-Type": "application/json" },
      // Nếu backend set CORS mặc định: app.use(cors())
    });
    // server trả: { message: "Mật khẩu mới đã được gửi qua email" }
    return res.data?.message || "Đã gửi email đặt lại mật khẩu.";
  } catch (err: any) {
    // Backend của bạn trả 404 khi email không tồn tại
    if (err?.response?.status === 404) {
      throw new Error(err.response.data?.message || "Email không tồn tại.");
    }
    throw new Error(err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
  }
}
