import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n';
import { api } from '../api';
import { useAppStore } from '../store';
import { ShoppingBag, Plus, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  category: string;
  stock: number;
  is_featured: boolean;
}

const CATEGORIES = ['全部', '服饰', '箱包', '饰品'];

export default function Shop() {
  const { t } = useI18n();
  const { addToCart } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.products.list()
      .then(setProducts)
      .catch(() => toast.error('商品加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === '全部' || p.category === category;
    const matchSearch = p.name.includes(search) || p.description.includes(search);
    return matchCat && matchSearch;
  });

  const handleAdd = (p: Product) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image_url,
      quantity: 1,
      type: 'handmade',
    });
    toast.success(`已将「${p.name}」加入购物车`);
  };

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ShoppingBag size={24} style={{ color: '#E84A3A' }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#E84A3A' }}>
                {t('shop.label') || '文创商城'}
              </span>
            </div>
            <h1 className="font-bold text-[#F0EDE0]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              {t('shop.title') || '非遗文创'}
            </h1>
            <p className="text-[#F0EDE0] opacity-50 mt-2">苗绣蜡染手作，把传统纹样带回家</p>
          </div>
          <Link
            to="/cart"
            className="px-5 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#2441A9', color: '#F0EDE0' }}
          >
            <ShoppingBag size={16} />
            去购物车
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all"
                style={{
                  backgroundColor: category === c ? '#E84A3A' : 'rgba(240,237,224,0.06)',
                  color: '#F0EDE0',
                  border: '1px solid rgba(240,237,224,0.08)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EDE0] opacity-40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商品..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-transparent outline-none"
              style={{ color: '#F0EDE0', border: '1px solid rgba(240,237,224,0.1)' }}
            />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#F0EDE0] opacity-50">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#F0EDE0] opacity-50">暂无商品</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={12} style={{ color: '#E84A3A' }} />
                    <span className="text-xs opacity-50" style={{ color: '#F0EDE0' }}>{p.category}</span>
                    {p.is_featured && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>
                        精选
                      </span>
                    )}
                  </div>
                  <h3 className="text-[#F0EDE0] font-bold mb-2">{p.name}</h3>
                  <p className="text-xs opacity-50 mb-4 line-clamp-2" style={{ color: '#F0EDE0' }}>{p.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: '#E84A3A' }}>¥{p.price}</span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-xs line-through opacity-40" style={{ color: '#F0EDE0' }}>¥{p.original_price}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ backgroundColor: 'rgba(36,65,169,0.2)', color: '#F0EDE0' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
