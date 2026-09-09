const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("miaoxiu-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || `HTTP ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (email: string, password: string, remember: boolean = false) =>
      request<{ access_token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember }),
      }),
    githubAuthorize: () => request<{ url: string }>("/auth/oauth/github/authorize"),
    wechatAuthorize: () => request<{ url: string }>("/auth/oauth/wechat/authorize"),
    qqAuthorize: () => request<{ url: string }>("/auth/oauth/qq/authorize"),
    register: (name: string, email: string, password: string, role: string = "user") =>
      request<{ access_token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      }),
    me: () => request<any>("/auth/me"),
    updateMe: (payload: { name?: string; avatar?: string; bio?: string }) =>
      request<any>("/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
  },
  ai: {
    generate: (payload: {
      prompt: string;
      style: string;
      colors: string[];
      batch_size: number;
      mode: string;
      image_base64?: string;
    }) => request<any[]>("/ai/generate", { method: "POST", body: JSON.stringify(payload) }),
    history: () => request<any[]>("/ai/history"),
  },
  patterns: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/patterns${query}`);
    },
    get: (id: string) => request<any>(`/patterns/${id}`),
    create: (payload: any) => request<any>("/patterns", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: any) => request<any>(`/patterns/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: string) => request<any>(`/patterns/${id}`, { method: "DELETE" }),
  },
  forum: {
    posts: (params?: Record<string, string | undefined>) => {
      const filtered = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) : {};
      const query = Object.keys(filtered).length > 0 ? "?" + new URLSearchParams(filtered as Record<string, string>).toString() : "";
      return request<any[]>(`/forum/posts${query}`);
    },
    createPost: (payload: { title: string; content: string; images?: string[]; tags?: string[] }) =>
      request<any>("/forum/posts", { method: "POST", body: JSON.stringify(payload) }),
    like: (postId: string) =>
      request<any>(`/forum/posts/${postId}/like`, { method: "POST" }),
    comments: (postId: string) =>
      request<any[]>(`/forum/posts/${postId}/comments`),
    createComment: (postId: string, content: string) =>
      request<any>(`/forum/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    audit: (postId: string, status: "approved" | "rejected") =>
      request<any>(`/forum/posts/${postId}/audit?status=${status}`, { method: "PUT" }),
  },
  courses: {
    list: () => request<any[]>("/courses"),
    get: (id: string) => request<any>(`/courses/${id}`),
    progress: (id: string) => request<{ progress: number; is_completed: boolean }>(`/courses/${id}/progress`),
    progressAll: () => request<any[]>("/courses/progress"),
    updateProgress: (id: string, progress: number) =>
      request<any>(`/courses/${id}/progress`, { method: "PUT", body: JSON.stringify({ progress }) }),
  },
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/products${query}`);
    },
    get: (id: string) => request<any>(`/products/${id}`),
    create: (payload: any) => request<any>("/products", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: any) => request<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: string) => request<any>(`/products/${id}`, { method: "DELETE" }),
  },
  cart: {
    list: () => request<any[]>("/products/cart/items"),
    add: (payload: { product_id: string; quantity: number }) =>
      request<any>("/products/cart/items", { method: "POST", body: JSON.stringify(payload) }),
    update: (itemId: string, quantity: number) =>
      request<any>(`/products/cart/items/${itemId}?quantity=${quantity}`, { method: "PUT" }),
    remove: (itemId: string) =>
      request<any>(`/products/cart/items/${itemId}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request<any[]>("/orders"),
    create: (items: { product_id: string; quantity: number }[]) =>
      request<any>("/orders", { method: "POST", body: JSON.stringify({ items }) }),
    pay: (id: string) => request<any>(`/orders/${id}/pay`, { method: "POST" }),
    },
  admin: {
    dashboard: () => request<any>("/admin/dashboard"),
    aiStats: () => request<any>("/admin/ai-stats"),
    users: () => request<any[]>("/users"),
    updateUserRole: (id: string, role: string) =>
      request<any>(`/users/${id}/role?role=${role}`, { method: "PUT" }),
    updateUserStatus: (id: string, isActive: boolean) =>
      request<any>(`/users/${id}/status?is_active=${isActive}`, { method: "PUT" }),
    orders: () => request<any[]>("/admin/orders"),
    updateOrderStatus: (id: string, status: string) =>
      request<any>(`/admin/orders/${id}/status?status=${status}`, { method: "PUT" }),
    logs: () => request<any[]>("/admin/logs"),
  },
  uploads: {
    image: async (file: File): Promise<{ url: string }> => {
      const token = localStorage.getItem("miaoxiu-token");
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${API_BASE}/uploads/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: "上传失败" }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      return resp.json() as Promise<{ url: string }>;
    },
  },
};

export function setToken(token: string) {
  localStorage.setItem("miaoxiu-token", token);
}

export function removeToken() {
  localStorage.removeItem("miaoxiu-token");
}

export function getToken() {
  return localStorage.getItem("miaoxiu-token");
}
