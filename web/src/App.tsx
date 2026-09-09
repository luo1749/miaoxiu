import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './auth';
import { I18nProvider } from './i18n';
import { AppProvider } from './store';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';

// Lazy load heavy pages for performance
const AIGenerator = lazy(() => import('./pages/AIGenerator'));
const ARExperience = lazy(() => import('./pages/ARExperience'));
const ARShowcase = lazy(() => import('./pages/ARShowcase'));
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));
const PatternDetail = lazy(() => import('./pages/PatternDetail'));
const StudyTour = lazy(() => import('./pages/StudyTour'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Forum = lazy(() => import('./pages/Forum'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Shop = lazy(() => import('./pages/Shop'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasPermission('admin')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function UserGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0E14' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#2441A9] border-r-transparent border-b-[#E84A3A] border-l-transparent animate-spin mx-auto mb-4" />
        <p className="text-[#F0EDE0] opacity-50 text-sm">加载中...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <AppProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/ai-generator" element={<Suspense fallback={<LoadingFallback />}><AIGenerator /></Suspense>} />
            <Route path="/ar-experience" element={<Suspense fallback={<LoadingFallback />}><ARExperience /></Suspense>} />
            <Route path="/ar-showcase" element={<Suspense fallback={<LoadingFallback />}><ARShowcase /></Suspense>} />
            <Route path="/knowledge-graph" element={<Suspense fallback={<LoadingFallback />}><KnowledgeGraph /></Suspense>} />
            <Route path="/knowledge-graph/:id" element={<Suspense fallback={<LoadingFallback />}><PatternDetail /></Suspense>} />
            <Route path="/study-tour" element={<Suspense fallback={<LoadingFallback />}><StudyTour /></Suspense>} />
            <Route path="/study-tour/:id" element={<Suspense fallback={<LoadingFallback />}><CourseDetail /></Suspense>} />
            <Route path="/forum" element={<Suspense fallback={<LoadingFallback />}><Forum /></Suspense>} />
            <Route path="/shop" element={<Suspense fallback={<LoadingFallback />}><Shop /></Suspense>} />
            <Route path="/cart" element={<Suspense fallback={<LoadingFallback />}><Cart /></Suspense>} />
            <Route path="/orders" element={<UserGuard><Suspense fallback={<LoadingFallback />}><Orders /></Suspense></UserGuard>} />
            <Route path="/profile" element={<UserGuard><Suspense fallback={<LoadingFallback />}><Profile /></Suspense></UserGuard>} />
            <Route path="/admin" element={<AdminGuard><Suspense fallback={<LoadingFallback />}><Admin /></Suspense></AdminGuard>} />
          </Route>
        </Routes>
      </AppProvider>
    </AuthProvider>
    </I18nProvider>
  );
}
