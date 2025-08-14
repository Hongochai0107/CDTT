import React, { createContext, useContext, useState } from 'react';

export type CartItem = {
  /** productId trên backend */
  id: number;
  name: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;

  /** id của dòng cart-item trên backend (nếu có) — dùng để update/xóa chính xác */
  cartItemId?: number | string;
};

type CartContextType = {
  cartItems: CartItem[];

  /** Thêm item (gộp theo productId+color+size) */
  addToCart: (item: CartItem) => void;

  /** Xóa theo productId (tương thích cũ); có thể chỉ định color/size để xóa đúng biến thể */
  removeFromCart: (id: number, color?: string, size?: string) => void;

  /** Cập nhật theo productId (tương thích cũ); có thể truyền kèm color/size để đúng biến thể */
  updateQuantity: (id: number, quantity: number, color?: string, size?: string) => void;

  /** Xóa tất cả */
  clearCart: () => void;

  /** Tổng tiền */
  getTotalPrice: () => number;

  /** Thay toàn bộ giỏ bằng dữ liệu từ backend */
  replaceCart: (items: CartItem[]) => void;

  /** === MỚI: thao tác chính xác theo cartItemId (nếu backend cung cấp) === */
  removeByCartItemId: (cartItemId: number | string) => void;
  updateQuantityByCartItemId: (cartItemId: number | string, quantity: number) => void;
};

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalPrice: () => 0,
  replaceCart: () => {},
  removeByCartItemId: () => {},
  updateQuantityByCartItemId: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  /** Helper so khớp biến thể */
  const isSameVariant = (a: CartItem, b: Partial<CartItem>) =>
    a.id === b.id &&
    (a.color ?? null) === (b.color ?? null) &&
    (a.size ?? null) === (b.size ?? null);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existed = prev.find((p) => isSameVariant(p, item));
      if (existed) {
        return prev.map((p) =>
          isSameVariant(p, item) ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }
      return [...prev, item];
    });
  };

  /** TƯƠNG THÍCH CŨ: nếu chỉ truyền id thì sẽ:
   *  - Nếu có 1 biến thể => xóa biến thể đó
   *  - Nếu có nhiều biến thể => xóa TẤT CẢ các biến thể cùng productId (giữ hành vi cũ)
   * Bạn có thể truyền thêm color/size để xóa đúng một dòng.
   */
  const removeFromCart = (id: number, color?: string, size?: string) => {
    setCartItems((prev) => {
      if (color || size) {
        return prev.filter((p) => !(p.id === id && (p.color ?? null) === (color ?? null) && (p.size ?? null) === (size ?? null)));
      }
      // giữ hành vi cũ: xóa mọi biến thể cùng productId
      return prev.filter((p) => p.id !== id);
    });
  };

  /** TƯƠNG THÍCH CŨ: nếu chỉ truyền id, quantity:
   *  - Nếu có nhiều biến thể cùng productId, sẽ cập nhật biến thể ĐẦU TIÊN tìm thấy.
   *  Hãy truyền kèm color/size để chắc chắn đúng biến thể cần cập nhật.
   */
  const updateQuantity = (id: number, quantity: number, color?: string, size?: string) => {
    setCartItems((prev) => {
      if (color || size) {
        return prev.map((p) =>
          p.id === id && (p.color ?? null) === (color ?? null) && (p.size ?? null) === (size ?? null)
            ? { ...p, quantity }
            : p
        );
      }
      // fallback: cập nhật biến thể đầu tiên có cùng productId
      let updated = false;
      return prev.map((p) => {
        if (!updated && p.id === id) {
          updated = true;
          return { ...p, quantity };
        }
        return p;
      });
    });
  };

  const clearCart = () => setCartItems([]);

  const getTotalPrice = () =>
    cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);

  const replaceCart = (items: CartItem[]) => setCartItems(items);

  /** === API theo cartItemId (khuyên dùng khi có từ backend) === */
  const removeByCartItemId = (cartItemId: number | string) => {
    setCartItems((prev) => prev.filter((p) => p.cartItemId !== cartItemId));
  };

  const updateQuantityByCartItemId = (cartItemId: number | string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((p) => (p.cartItemId === cartItemId ? { ...p, quantity } : p))
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        replaceCart,
        removeByCartItemId,
        updateQuantityByCartItemId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
