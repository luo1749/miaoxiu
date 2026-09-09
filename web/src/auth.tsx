import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, setToken, removeToken } from "./api";

export type UserRole = "guest" | "user" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email: string;
  bio: string;
  savedWorks: string[];
  posts: number;
  likes: number;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  setAuthFromToken: (token: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  hasPermission: (minRole: UserRole) => boolean;
  updateProfile: (data: Partial<AuthUser>) => void;
}

const DEFAULT_AVATARS: Record<UserRole, string> = {
  guest: "images/pattern-4.jpg",
  user: "images/pattern-5.jpg",
  admin: "images/pattern-1.jpg",
};

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@gene-e.com": {
    password: "admin123",
    user: {
      id: "admin-1",
      name: "项目管理员",
      avatar: "images/pattern-1.jpg",
      role: "admin",
      email: "admin@gene-e.com",
      bio: "锦绣黔境项目管理员，负责平台运营与数据管理",
      savedWorks: [],
      posts: 12,
      likes: 348,
    },
  },
  "user@gene-e.com": {
    password: "user123",
    user: {
      id: "user-1",
      name: "文创探索者",
      avatar: "images/pattern-5.jpg",
      role: "user",
      email: "user@gene-e.com",
      bio: "热爱苗族文化，用AI探索传统纹样的无限可能",
      savedWorks: ["images/pattern-3.jpg", "images/pattern-8.jpg"],
      posts: 5,
      likes: 86,
    },
  },
};

function backendUserToAuthUser(u: any): AuthUser {
  return {
    id: String(u.id),
    name: u.name,
    avatar: u.avatar || DEFAULT_AVATARS[u.role as UserRole] || DEFAULT_AVATARS.user,
    role: u.role,
    email: u.email,
    bio: u.bio || "",
    savedWorks: [],
    posts: 0,
    likes: 0,
  };
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("miaoxiu-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 启动时尝试从后端恢复登录状态
  useEffect(() => {
    const token = localStorage.getItem("miaoxiu-token");
    if (token && !user) {
      setIsLoading(true);
      api.auth
        .me()
        .then((u) => {
          const authUser = backendUserToAuthUser(u);
          setUser(authUser);
          localStorage.setItem("miaoxiu-user", JSON.stringify(authUser));
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean = false): Promise<boolean> => {
    setError(null);
    // 优先走后端认证
    try {
      const data = await api.auth.login(email, password, remember);
      const authUser = backendUserToAuthUser(data.user);
      setToken(data.access_token);
      setUser(authUser);
      localStorage.setItem("miaoxiu-user", JSON.stringify(authUser));
      return true;
    } catch (e) {
      // 后端不可用时降级为本地演示账号
      const demo = DEMO_USERS[email];
      if (demo && demo.password === password) {
        setUser(demo.user);
        localStorage.setItem("miaoxiu-user", JSON.stringify(demo.user));
        return true;
      }
      const registered = localStorage.getItem(`gene-e-reg-${email}`);
      if (registered) {
        const regData = JSON.parse(registered);
        if (regData.password === password) {
          setUser(regData.user);
          localStorage.setItem("miaoxiu-user", JSON.stringify(regData.user));
          return true;
        }
      }
      setError(e instanceof Error ? e.message : "登录失败");
      return false;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole = "user"): Promise<boolean> => {
      setError(null);
      if (DEMO_USERS[email]) {
        setError("该邮箱为演示账号，不可注册");
        return false;
      }
      try {
        const data = await api.auth.register(name, email, password, role);
        const authUser = backendUserToAuthUser(data.user);
        setToken(data.access_token);
        setUser(authUser);
        localStorage.setItem("miaoxiu-user", JSON.stringify(authUser));
        return true;
      } catch (e) {
        if (localStorage.getItem(`gene-e-reg-${email}`)) {
          setError("该邮箱已被注册");
          return false;
        }
        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          name,
          avatar: DEFAULT_AVATARS[role],
          role,
          email,
          bio: "新晋非遗文化探索者",
          savedWorks: [],
          posts: 0,
          likes: 0,
        };
        localStorage.setItem(`gene-e-reg-${email}`, JSON.stringify({ password, user: newUser }));
        setUser(newUser);
        localStorage.setItem("miaoxiu-user", JSON.stringify(newUser));
        return true;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    removeToken();
    localStorage.removeItem("miaoxiu-user");
  }, []);

  const hasPermission = useCallback(
    (minRole: UserRole): boolean => {
      if (!user) return minRole === "guest";
      const hierarchy: Record<UserRole, number> = { guest: 0, user: 1, admin: 2 };
      return hierarchy[user.role] >= hierarchy[minRole];
    },
    [user]
  );

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("miaoxiu-user", JSON.stringify(updated));
      return updated;
    });
    // 同步到后端
    try {
      await api.auth.updateMe(data);
    } catch {
      // 忽略后端同步失败，本地已更新
    }
  }, []);

  const setAuthFromToken = useCallback(async (token: string): Promise<boolean> => {
    setToken(token);
    try {
      const u = await api.auth.me();
      const authUser = backendUserToAuthUser(u);
      setUser(authUser);
      localStorage.setItem("miaoxiu-user", JSON.stringify(authUser));
      return true;
    } catch (e) {
      removeToken();
      setError(e instanceof Error ? e.message : "登录失败");
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        hasPermission,
        updateProfile,
        setAuthFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

