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

  // Cart rows are tied to session_id while browsing as a guest. If someone
  // logs in (or creates an account) partway through — e.g. from the login
  // banner on the Checkout page — refreshCart() switches to querying by
  // user_id, and the guest's items would otherwise silently vanish from
  // view even though the rows still exist under the old session_id. This
  // claims those rows for the newly authenticated user instead, then merges
  // any duplicates (same legend + variant already in their account cart).
  const mergeGuestCartIntoUser = async (userId: string) => {
    const sessionId = getSessionId();

    // Claim guest rows for this browser session (NULL -> own user id).
    // Update by session_id directly — authenticated users can't SELECT
    // rows with user_id IS NULL under the existing view policy, but the
    // claim UPDATE policy (20260820130000) allows this transition.
    await supabase
      .from('cart_items')
      .update({ user_id: userId })
      .eq('session_id', sessionId)
      .is('user_id', null);

    const { data: userItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (!userItems || userItems.length === 0) return;

    const seen = new Map<string, string>();
    for (const item of userItems) {
      const key = `${item.legend_id}:${item.product_variant_id}`;
      const existingId = seen.get(key);

      if (!existingId) {
        seen.set(key, item.id);
        continue;
      }

      // Same product now appears twice (one was already in the account
      // cart, one was just claimed from the guest session) — combine them
      // into a single line item instead of showing a duplicate row.
      const existing = userItems.find((i) => i.id === existingId);
      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + item.quantity })
          .eq('id', existing.id);
        await supabase.from('cart_items').delete().eq('id', item.id);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        mergeGuestCartIntoUser(session.user.id).then(refreshCart);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
