// Simple global state management using React Context
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './auth';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  elements: string[];
  meaning: string;
  timestamp: number;
  likes: number;
  liked: boolean | null;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  type: 'ai' | 'handmade';
}

export interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  tags: string[];
  timestamp: number;
  liked: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  bio: string;
  savedImages: GeneratedImage[];
  posts: ForumPost[];
  likes: number;
  followers: number;
}

interface AppState {
  // AI Generator
  generatedImages: GeneratedImage[];
  addGeneratedImage: (img: GeneratedImage) => void;
  toggleLike: (id: string) => void;

  // Cart
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Forum
  forumPosts: ForumPost[];
  addForumPost: (post: ForumPost) => void;
  toggleForumLike: (id: string) => void;

  // User
  user: UserProfile;
  saveImage: (img: GeneratedImage) => void;
  unsaveImage: (id: string) => void;

  // Admin
  isAdmin: boolean;
}

const defaultUser: UserProfile = {
  name: '创意探索者',
  avatar: 'images/pattern-5.jpg',
  bio: '热爱苗族文化，用AI探索传统纹样的无限可能',
  savedImages: [],
  posts: [],
  likes: 0,
  followers: 0,
};

const defaultPosts: ForumPost[] = [
  {
    id: '1',
    author: '纹样研究员',
    avatar: 'images/pattern-1.jpg',
    title: '分享一组用AI生成的蝴蝶妈妈系列纹样',
    content: '最近用我们的AI纹样生成器创作了一组以蝴蝶妈妈为主题的纹样，融合了传统几何对称与现代抽象风格，效果非常惊艳！',
    images: ['images/pattern-3.jpg', 'images/pattern-8.jpg'],
    likes: 128,
    comments: 23,
    tags: ['AI生成', '蝴蝶妈妈', '创作分享'],
    timestamp: Date.now() - 86400000,
    liked: false,
  },
  {
    id: '2',
    author: '蜡染传承人',
    avatar: 'images/pattern-4.jpg',
    title: '关于传统蜡染工艺的几点思考',
    content: '作为从事蜡染工艺三十年的手艺人，很高兴看到年轻人用新技术让传统纹样焕发新生。AI不是替代，而是让更多人认识我们的文化。',
    images: ['images/pattern-6.jpg'],
    likes: 256,
    comments: 45,
    tags: ['传统技艺', '蜡染', '传承'],
    timestamp: Date.now() - 172800000,
    liked: false,
  },
  {
    id: '3',
    author: '设计新锐',
    avatar: 'images/pattern-7.jpg',
    title: 'AR试穿功能体验反馈',
    content: '刚刚体验了AR虚拟试穿功能，将生成的铜鼓纹贴到了T恤上，效果很逼真！希望能增加更多服饰模板。',
    images: ['images/pattern-5.jpg', 'images/pattern-9.jpg'],
    likes: 89,
    comments: 15,
    tags: ['AR体验', '功能反馈', '铜鼓纹'],
    timestamp: Date.now() - 259200000,
    liked: false,
  },
];

const CART_STORAGE_KEY = 'miaoxiu-cart';

function mapServerCartItem(item: any): CartItem {
  return {
    id: item.id,
    productId: item.product?.id ?? item.id,
    name: item.product?.name ?? '商品',
    price: item.product?.price ?? 0,
    image: item.product?.image_url ?? '',
    quantity: item.quantity,
    type: 'handmade',
  };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(defaultPosts);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [hasSyncedCart, setHasSyncedCart] = useState(false);
  const isAdmin = true;

  // 游客购物车持久化到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // 登录后将本地购物车合并到后端，然后拉取服务端购物车
  useEffect(() => {
    if (!isLoggedIn) {
      setHasSyncedCart(false);
      return;
    }
    if (hasSyncedCart) return;
    setHasSyncedCart(true);
    (async () => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        const localItems: CartItem[] = raw ? JSON.parse(raw) : [];
        const serverItems = await api.cart.list();
        const serverProductIds = new Set(serverItems.map((item) => item.product?.id ?? item.id));
        const toMerge = localItems.filter((item) => !serverProductIds.has(item.productId || item.id));
        if (toMerge.length > 0) {
          await Promise.allSettled(
            toMerge.map((item) =>
              api.cart.add({ product_id: item.productId || item.id, quantity: item.quantity })
            )
          );
        }
        const freshServerItems = await api.cart.list();
        setCart(freshServerItems.map(mapServerCartItem));
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (e) {
        console.error('购物车同步失败', e);
      }
    })();
  }, [isLoggedIn, hasSyncedCart]);

  const addGeneratedImage = useCallback((img: GeneratedImage) => {
    setGeneratedImages((prev) => [img, ...prev]);
  }, []);

  const toggleLike = useCallback((id: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) => {
        if (img.id === id) {
          const newLiked = img.liked === true ? null : true;
          return { ...img, liked: newLiked, likes: newLiked === true ? img.likes + 1 : img.likes - 1 };
        }
        return img;
      })
    );
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const addForumPost = useCallback((post: ForumPost) => {
    setForumPosts((prev) => [post, ...prev]);
    setUser((u) => ({ ...u, posts: [post, ...u.posts] }));
  }, []);

  const toggleForumLike = useCallback((id: string) => {
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
        }
        return p;
      })
    );
  }, []);

  const saveImage = useCallback((img: GeneratedImage) => {
    setUser((u) => ({ ...u, savedImages: [img, ...u.savedImages] }));
  }, []);

  const unsaveImage = useCallback((id: string) => {
    setUser((u) => ({ ...u, savedImages: u.savedImages.filter((img) => img.id !== id) }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        generatedImages,
        addGeneratedImage,
        toggleLike,
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        forumPosts,
        addForumPost,
        toggleForumLike,
        user,
        saveImage,
        unsaveImage,
        isAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
