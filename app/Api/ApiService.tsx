
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';

const API_URL = 'http://localhost:8080/api';

// Lấy token JWT từ AsyncStorage
async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('jwt-token');
  } catch (error) {
    console.error('Lỗi lấy token:', error);
    return null;
  }
}

// Hàm gọi API tổng quát
export async function callApi(
  endpoint: string,
  method: string,
  data: any = null
): Promise<AxiosResponse<any>> {
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJVc2VyIERldGFpbHMiLCJpc3MiOiJFdmVudCBTY2hlZHVsZXIiLCJpYXQiOjE3NTQ2MjI2OTMsImVtYWlsIjoiaG9uZ29jaGFpMTcyNEBnbWFpbC5jb20ifQ.ENynNgjZ-JqwWSx7LQZvZ1JFA9ah4JdbOBYrbbCGmjE";

  const config = {
    method,
    url: `${API_URL}/${endpoint}`,
    data,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error: any) {
    console.error(`API ${method} ${endpoint} thất bại:`, error.response?.data || error.message);
    throw error;
  }
}

// ======= CÁC HÀM API CƠ BẢN =======

// GET tất cả
export function GET_ALL(endpoint: string): Promise<AxiosResponse<any>> {
  return callApi(endpoint, 'GET');
}

export function GET_IMAGE(endpoint: string, id: string | number): Promise<AxiosResponse<any>> {
  return callApi(`${endpoint}/${id}`, 'GET');
}

// GET theo ID
export function GET_ID(endpoint: string, id: string | number): Promise<AxiosResponse<any>> {
  return callApi(`${endpoint}/${id}`, 'GET');
}

// GET phân trang + lọc theo categoryId
export function GET_PAGE(
  endpoint: string,
  page: number = 0,
  size: number = 10,
  categoryId: string | null = null
): Promise<AxiosResponse<any>> {
  let url = `${endpoint}?page=${page}&size=${size}`;
  if (categoryId) {
    url += `&categoryId=${categoryId}`;
  }
  return callApi(url, 'GET');
}

// POST
export function POST(endpoint: string, data: any): Promise<AxiosResponse<any>> {
  return callApi(endpoint, 'POST', data);
}

// PUT
export function PUT(endpoint: string, data: any): Promise<AxiosResponse<any>> {
  return callApi(endpoint, 'PUT', data);
}

// DELETE
export function DELETE(endpoint: string, id: string | number): Promise<AxiosResponse<any>> {
  return callApi(`${endpoint}/${id}`, 'DELETE');
}

// ======= CÁC HÀM CỤ THỂ =======

// Đăng ký
export const registerUser = async (username: string, password: string) => {
  try {
    const response = await POST('auth/register', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Đăng nhập
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await POST('login', { email, password });

    // Lưu token nếu có
    const token = response.data?.['jwt-token'];
    if (token) {
      await AsyncStorage.setItem('jwt-token', token);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy tất cả sản phẩm (public)
export const getAllProducts = async () => {
  try {
    const response = await GET_ALL('public/products');
    console.log('Lấy tất cả sản phẩm thành công:', response);
    return response.data.content;
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (productId: number) => {
  try {
    const response = await GET_ID('public/products', productId);
    console.log('Lấy sản phẩm theo ID thành công:', response);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getAllCategoriesWithProducts = async () => {
  try {
    const catResponse = await GET_ALL('public/categories');
    const categories = catResponse.data.content;

    const categoriesWithProducts = await Promise.all(
      categories.map(async (cat: any) => {
        try {
          const productResponse = await GET_ALL(`public/categories/${cat.categoryId}/products`);
          const productsRaw = productResponse.data.content ?? productResponse.data;

          // Sắp xếp theo specialPrice tăng dần và lấy 4 sản phẩm đầu
          const topProducts = [...productsRaw]
            .filter(p => typeof p.specialPrice === 'number')
            .sort((a, b) => a.specialPrice - b.specialPrice)
            .slice(0, 4);

          return {
            ...cat,
            productCount: productsRaw.length,
            products: topProducts,
          };
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

// Lấy sản phẩm flash sale (discount > 0)
export const getFlashSaleProducts = async () => {
  try {
    const response = await GET_ALL('public/products');
    // Nếu API trả về mảng trong response.data.content
    const allProducts = response.data.content || [];
    // Lọc sản phẩm có discount > 0
    const flashSaleProducts = allProducts.filter((product: any) => {
      // Có thể là discount hoặc specialPrice, tuỳ backend
      return (typeof product.discount === 'number' && product.discount > 0) ||
             (typeof product.specialPrice === 'number' && product.specialPrice > 0 && product.specialPrice < product.price);
    });
    return flashSaleProducts;
  } catch (error) {
    throw error;
  }
};