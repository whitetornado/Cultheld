import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getSessionId } from './supabase';
import { CartItem } from './types';
import { useToast } from './toast';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addToCart: (legendId: string, variantId: string, quantity: number, previewUrl?: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const { success, error: showError } = useToast();

  const refreshCart = async () => {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('cart_items')
      .select(`
        *,
        legend:legends(*),
        product_variant:product_variants(*)
      `);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setItems(data as CartItem[]);
      setItemCount(data.reduce((sum, item) => sum + item.quantity, 0));
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (legendId: string, variantId: string, quantity: number, previewUrl?: string): Promise<boolean> => {
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      const existingItem = items.find(
        item => item.legend_id === legendId && item.product_variant_id === variantId
      );

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        success(`${quantity} item${quantity > 1 ? 's' : ''} toegevoegd aan winkelmandje`);
        return true;
      } else {
        const { error } = await supabase.from('cart_items').insert({
          session_id: sessionId,
          user_id: user?.id || null,
          legend_id: legendId,
          product_variant_id: variantId,
          quantity,
          preview_url: previewUrl || null,
        });

        if (error) {
          console.error('Add to cart error:', error);
          showError('Fout bij toevoegen aan winkelmandje');
          return false;
        }

        await refreshCart();
        success(`${quantity} item${quantity > 1 ? 's' : ''} toegevoegd aan winkelmandje`);
        return true;
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      showError('Fout bij toevoegen aan winkelmandje');
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (!error) {
      await refreshCart();
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      await refreshCart();
    }
  };

  const clearCart = async () => {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from('cart_items').delete();

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', sessionId);
    }

    await query;
    await refreshCart();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
