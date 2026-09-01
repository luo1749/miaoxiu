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
    login: (email: string, password: string) =>
      request<{ access_token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string, role: string = "user") =>
      request<{ access_token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      }),
    me: () => request<any>("/auth/me"),
  },
  ai: {
    generate: (payload: {
      prompt: string;
      style: string;
      colors: string[];
      batch_size: number;
      mode: string;
    }) => request<any[]>("/ai/generate", { method: "POST", body: JSON.stringify(payload) }),
    history: () => request<any[]>("/ai/history"),
  },
  patterns: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/patterns${query}`);
    },
    get: (id: string) => request<any>(`/patterns/${id}`),
  },
  forum: {
    posts: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/forum/posts${query}`);
    },
    createPost: (payload: { title: string; content: string; images?: string[]; tags?: string[] }) =>
      request<any>("/forum/posts", { method: "POST", body: JSON.stringify(payload) }),
    like: (postId: string) =>
      request<any>(`/forum/posts/${postId}/like`, { method: "POST" }),
  },
  courses: {
    list: () => request<any[]>("/courses"),
    get: (id: string) => request<any>(`/courses/${id}`),
    updateProgress: (id: string, progress: number) =>
      request<any>(`/courses/${id}/progress`, { method: "PUT", body: JSON.stringify({ progress }) }),
  },
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<any[]>(`/products${query}`);
    },
    get: (id: string) => request<any>(`/products/${id}`),
  },
  orders: {
    list: () => request<any[]>("/orders"),
    create: (items: { product_id: string; quantity: number }[]) =>
      request<any>("/orders", { method: "POST", body: JSON.stringify({ items }) }),
    pay: (id: string) => request<any>(`/orders/${id}/pay`, { method: "POST" }),
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
