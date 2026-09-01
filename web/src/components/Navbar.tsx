import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { useAppStore } from '../store';
import {
  Sparkles, Glasses, Layers, BookOpen, GraduationCap,
  MessageSquare, ShoppingCart, Menu, X,
  LayoutDashboard, LogIn, LogOut, Shield, Globe, ShoppingBag,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/ai-generator', labelKey: 'nav.ai', icon: Sparkles },
  { path: '/ar-showcase', labelKey: 'nav.ar_showcase', icon: Layers },
  { path: '/ar-experience', labelKey: 'nav.ar', icon: Glasses },
  { path: '/knowledge-graph', labelKey: 'nav.kg', icon: BookOpen },
  { path: '/study-tour', labelKey: 'nav.study', icon: GraduationCap },
  { path: '/forum', labelKey: 'nav.forum', icon: MessageSquare },
  { path: '/shop', labelKey: 'nav.shop', icon: ShoppingBag },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { cart } = useAppStore();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggleLang = () => setLang(lang === 'zh' ? 'en' : 'zh');

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      style={{
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        backgroundColor: scrolled ? 'rgba(11, 14, 20, 0.9)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(240, 237, 224, 0.06)' : 'none',
      }}
    >
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="images/logo.jpg"
            alt="纹智苗韵 Logo"
            className="w-9 h-9 rounded-lg object-cover transition-all group-hover:scale-110"
            style={{ border: '1px solid rgba(240,237,224,0.1)' }}
          />
          <div className="flex flex-col">
            <span className="text-[#F0EDE0] text-sm font-bold tracking-wide leading-tight">纹智苗韵</span>
            <span className="text-[#F0EDE0] text-[9px] opacity-40 leading-tight">Miao Pattern AI</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-2.5 py-2 text-xs transition-all duration-200 rounded-md"
                style={{
                  color: isActive ? '#F0EDE0' : 'rgba(240, 237, 224, 0.55)',
                  backgroundColor: isActive ? 'rgba(36, 65, 169, 0.15)' : 'transparent',
                }}
              >
                <span className="flex items-center gap-1">
                  {item.icon && <item.icon size={12} />}
                  {t(item.labelKey)}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full" style={{ width: '50%', backgroundColor: '#E84A3A' }} />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs transition-all duration-200 rounded-md"
              style={{
                color: location.pathname === '/admin' ? '#F0EDE0' : 'rgba(240, 237, 224, 0.55)',
                backgroundColor: location.pathname === '/admin' ? 'rgba(232, 74, 58, 0.15)' : 'transparent',
              }}
            >
              <LayoutDashboard size={12} />
              {t('nav.admin')}
            </Link>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-all hover:bg-white/5"
            style={{ color: 'rgba(240,237,224,0.6)', border: '1px solid rgba(240,237,224,0.08)' }}
            title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Globe size={12} />
            <span className="font-medium">{lang === 'zh' ? '中' : 'EN'}</span>
          </button>

          <Link to="/cart" className="relative p-1.5 rounded-full transition-all hover:bg-white/5">
            <ShoppingCart size={16} className="text-[#F0EDE0] opacity-60" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: '#E84A3A', color: '#F0EDE0' }}>
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link to="/profile" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5">
                <img src={user!.avatar} alt="" className="w-5 h-5 rounded-full object-cover" style={{ border: '1px solid rgba(36,65,169,0.5)' }} />
                <span className="text-[11px] text-[#F0EDE0] opacity-80 max-w-[60px] truncate">{user!.name}</span>
                {isAdmin && <Shield size={10} style={{ color: '#E84A3A' }} />}
              </Link>
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/5 transition-all" title={t('nav.logout')}>
                <LogOut size={14} className="text-[#F0EDE0] opacity-30 hover:opacity-80" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ backgroundColor: 'rgba(232,74,58,0.12)', color: '#E84A3A', border: '1px solid rgba(232,74,58,0.2)' }}
            >
              <LogIn size={12} />
              {t('nav.login')}
            </Link>
          )}

          <button className="lg:hidden p-1.5 rounded-md hover:bg-white/5" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} className="text-[#F0EDE0]" /> : <Menu size={18} className="text-[#F0EDE0]" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden px-6 pb-4" style={{ backgroundColor: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm"
                style={{
                  color: location.pathname === item.path ? '#F0EDE0' : 'rgba(240,237,224,0.6)',
                  backgroundColor: location.pathname === item.path ? 'rgba(36,65,169,0.15)' : 'transparent',
                }}
              >
                {item.icon && <item.icon size={14} />}
                {t(item.labelKey)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm"
                style={{
                  color: location.pathname === '/admin' ? '#F0EDE0' : 'rgba(240,237,224,0.6)',
                  backgroundColor: location.pathname === '/admin' ? 'rgba(232,74,58,0.15)' : 'transparent',
                }}
              >
                <LayoutDashboard size={14} />
                {t('nav.admin')}
              </Link>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm" style={{ color: '#E84A3A' }}>
                <LogIn size={14} /> {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

