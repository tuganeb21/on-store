import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, cartAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

// ── AUTH STORE ─────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          initSocket(data.token);
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.register(formData);
          localStorage.setItem('token', data.token);
          initSocket(data.token);
          set({ user: data.user, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        disconnectSocket();
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.me();
          set({ user: data.user });
          return data.user;
        } catch {
          get().logout();
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'onstore-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── CART STORE ─────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  count: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await cartAPI.get();
      set({ items: data.data, total: data.total, count: data.count, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  addItem: async (product_id, quantity = 1) => {
    await cartAPI.add({ product_id, quantity });
    await get().fetchCart();
  },

  updateItem: async (id, qty) => {
    await cartAPI.update(id, qty);
    await get().fetchCart();
  },

  removeItem: async (id) => {
    await cartAPI.remove(id);
    await get().fetchCart();
  },

  clearCart: async () => {
    await cartAPI.clear();
    set({ items: [], total: 0, count: 0 });
  },

  // Optimistic local cart (for unauthenticated users)
  localItems: [],
  addLocal: (product, qty = 1) => {
    set((s) => {
      const existing = s.localItems.find((i) => i.id === product.id);
      if (existing) {
        return { localItems: s.localItems.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i) };
      }
      return { localItems: [...s.localItems, { ...product, qty }] };
    });
  },
}));

// ── WISHLIST STORE ─────────────────────────────────────
export const useWishlistStore = create((set, get) => ({
  items: [],
  ids: new Set(),

  fetchWishlist: async () => {
    try {
      const { data } = await wishlistAPI.get();
      const items = data.data;
      set({ items, ids: new Set(items.map((i) => i.product_id)) });
    } catch {}
  },

  toggle: async (product_id) => {
    const { ids } = get();
    const wasIn = ids.has(product_id);
    // Optimistic update
    set((s) => {
      const newIds = new Set(s.ids);
      wasIn ? newIds.delete(product_id) : newIds.add(product_id);
      return { ids: newIds };
    });
    try {
      await wishlistAPI.toggle(product_id);
      await get().fetchWishlist();
    } catch {
      // Rollback
      set((s) => {
        const newIds = new Set(s.ids);
        wasIn ? newIds.add(product_id) : newIds.delete(product_id);
        return { ids: newIds };
      });
    }
  },

  isWishlisted: (id) => get().ids.has(id),
}));

// ── NOTIFICATION STORE ─────────────────────────────────
export const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetch: async () => {
    try {
      const { data } = await notifAPI.list({ limit: 20 });
      set({ notifications: data.data, unreadCount: data.unread_count });
    } catch {}
  },

  markAllRead: async () => {
    await notifAPI.markAllRead();
    set({ unreadCount: 0, notifications: get().notifications.map((n) => ({ ...n, is_read: true })) });
  },

  addNew: (notif) => {
    set((s) => ({ notifications: [notif, ...s.notifications], unreadCount: s.unreadCount + 1 }));
  },
}));

// fix missing import
import { wishlistAPI, notifAPI } from '../services/api';
