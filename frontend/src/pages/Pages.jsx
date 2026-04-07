// â”€â”€â”€ ProductDetail.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productAPI, reviewAPI, categoryAPI, analyticsAPI, orderAPI, wishlistAPI, chatAPI, toAssetUrl } from '../services/api';
import { useAuthStore, useCartStore, useWishlistStore } from '../context/store';
import { getSocket } from '../services/socket';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    productAPI.get(slug).then(({ data }) => { setProduct(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [slug]);

  const handleAddCart = async () => {
    if (!user) { navigate('/auth'); return; }
    try { await addItem(product.id, qty); toast.success(`Added ${qty}× to cart`); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>Loading...</div>;
  if (!product) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>Product not found</div>;

  const wishlisted = isWishlisted(product.id);
  const inStock = product.stock > 0;
  const isBuyer = user?.role === 'buyer';

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 18, fontFamily: 'var(--fm)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ cursor: 'pointer', color: 'var(--indigo)' }} onClick={() => navigate('/')}>Explore</span>
        <span style={{ color: 'var(--gray2)' }}>/</span>
        <span style={{ color: 'var(--gray2)' }}>{product.category_name}</span>
        <span style={{ color: 'var(--gray2)' }}>/</span>
        <span>{product.name.slice(0, 30)}...</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--rl)', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, position: 'relative' }}>
              <div className="product-img-pattern" />
              {product.images?.[activeImg]?.image_url
                ? <img src={toAssetUrl(product.images[activeImg].image_url)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ position: 'relative', zIndex: 1 }}>📦</span>
              }
            </div>
            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 7, padding: 10 }}>
                {product.images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--surface)', border: `1.5px solid ${i === activeImg ? 'var(--indigo)' : 'transparent'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {img.image_url ? <img src={toAssetUrl(img.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 10, lineHeight: 1.2 }}>{product.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="badge badge-indigo">{product.store_name}</span>
            {product.avg_rating > 0 && <span className="badge badge-amber">★ {parseFloat(product.avg_rating).toFixed(1)} · {product.reviews?.length || 0} reviews</span>}
            {product.stock <= 10 && product.stock > 0 && <span className="badge badge-rose">Only {product.stock} left</span>}
          </div>

          <div style={{ fontFamily: 'var(--fd)', fontSize: 34, letterSpacing: -1, marginBottom: 16 }}>${parseFloat(product.price).toFixed(2)}</div>
          <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 20, fontWeight: 300 }}>{product.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, fontSize: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: inStock ? 'var(--teal)' : 'var(--rose)' }} />
            <span style={{ color: inStock ? 'var(--teal)' : 'var(--rose)', fontWeight: 600, fontFamily: 'var(--fm)' }}>{inStock ? 'In stock' : 'Out of stock'}</span>
            {inStock && <span style={{ color: 'var(--gray)' }}>— {product.stock} units</span>}
          </div>

          {inStock && isBuyer && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <div className="qty-val">{qty}</div>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(q + 1, product.stock))}>+</button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: 14 }} onClick={handleAddCart}>Add to cart</button>
              <button
                onClick={() => { if (!user) { navigate('/auth'); return; } toggle(product.id); toast(wishlisted ? 'Removed from wishlist' : '♡ Added to wishlist'); }}
                style={{ width: 40, height: 40, border: `1.5px solid ${wishlisted ? 'var(--rose)' : 'var(--border2)'}`, borderRadius: 8, background: wishlisted ? 'var(--rose-light)' : 'none', cursor: 'pointer', color: wishlisted ? 'var(--rose)' : 'var(--gray2)', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--ease)' }}
              >{wishlisted ? '♥' : '♡'}</button>
            </div>
          )}

          {isBuyer && (
            <button className="btn btn-teal btn-full" style={{ marginBottom: 8 }} onClick={() => { handleAddCart(); navigate('/cart'); }}>Buy now</button>
          )}
          {isBuyer && product.seller_profile_id && (
            <button
              className="btn btn-ghost btn-full"
              style={{ marginBottom: 18 }}
              onClick={() => navigate(`/chat?seller_id=${product.seller_profile_id}`)}
            >
              Contact seller
            </button>
          )}

          <hr className="divider" />

          {/* Reviews */}
          {product.reviews?.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Reviews</div>
              {product.reviews.slice(0, 3).map((r) => (
                <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--indigo-light)', color: 'var(--indigo)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.username?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{r.username}</span>
                    <span style={{ color: 'var(--amber)', fontSize: 11, marginLeft: 'auto' }}>{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.title && <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>}
                  <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.6 }}>{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Auth.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Auth() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', store_name: '', phone: '' });

  const isRegister = mode === 'register';
  const set = (k) => (e) => { clearError(); setForm((f) => ({ ...f, [k]: e.target.value })); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) await register({ ...form, role });
      else await login({ email: form.email, password: form.password });
      navigate('/');
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
    } catch {}
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ fontFamily: 'var(--fd)', fontSize: 24, textAlign: 'center', marginBottom: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, background: 'var(--indigo)', borderRadius: '50%' }} />
          OnStore
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray)', textAlign: 'center', marginBottom: 22 }}>
          {isRegister ? 'Create your account' : 'Welcome back'}
        </div>

        {isRegister && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
            {['buyer', 'seller', 'admin'].map((r) => (
              <button key={r} onClick={() => setRole(r)}
                style={{ padding: 9, fontSize: 13, textAlign: 'center', border: 'none', cursor: 'pointer', background: role === r ? 'var(--indigo)' : 'none', color: role === r ? '#fff' : 'var(--gray)', fontFamily: 'var(--ff)', fontWeight: 500, transition: 'all var(--ease)', textTransform: 'capitalize' }}>
                {r}
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ background: 'var(--rose-light)', color: 'var(--rose)', border: '1px solid var(--rose-mid)', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14, fontWeight: 500 }}>{error}</div>}

        <form onSubmit={submit}>
          {isRegister && role === 'buyer' && <><label className="input-label">Full name</label><input className="input" style={{ marginBottom: 12 }} placeholder="Jane Doe" value={form.full_name} onChange={set('full_name')} /></>}
          {isRegister && role === 'seller' && <><label className="input-label">Store name</label><input className="input" style={{ marginBottom: 12 }} placeholder="My Store" value={form.store_name} onChange={set('store_name')} required /></>}
          {isRegister && <><label className="input-label">Username</label><input className="input" style={{ marginBottom: 12 }} placeholder="janedoe" value={form.username} onChange={set('username')} required /></>}
          <label className="input-label">Email</label>
          <input className="input" style={{ marginBottom: 12 }} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          <label className="input-label">Password</label>
          <input className="input" style={{ marginBottom: 16 }} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} />
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="divider-text" style={{ marginTop: 14 }}>or</div>
        <div style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span style={{ color: 'var(--indigo)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Sign in' : 'Sign up free'}
          </span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Cart.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Cart() {
  const navigate = useNavigate();
  const { items, total, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const [payMethod, setPayMethod] = useState('mobile_money');
  const [placing, setPlacing] = useState(false);

  useEffect(() => { if (user) fetchCart(); }, [user]);

  const tax = total * 0.05;
  const finalTotal = total + tax;

  const handleCheckout = async () => {
    setPlacing(true);
    try {
      await orderAPI.place({ payment_method: payMethod });
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Checkout failed');
    }
    setPlacing(false);
  };

  if (!user) return (
    <div className="container" style={{ paddingTop: 60 }}>
      <div className="empty-state">
        <div className="empty-state-icon">🛒</div>
        <div className="empty-state-title">Sign in to view your cart</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button>
      </div>
    </div>
  );

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 24 }}>Shopping cart</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Your cart is empty</div>
          <div className="empty-state-sub">Start exploring products</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Browse products</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
          <div>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 13, padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 70, height: 70, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {item.image ? <img src={toAssetUrl(item.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} /> : '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--indigo)', fontFamily: 'var(--fm)', fontWeight: 600, marginBottom: 2 }}>{item.store_name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="qty-ctrl" style={{ borderColor: 'var(--border)' }}>
                      <button className="qty-btn" style={{ width: 28, height: 30, fontSize: 14 }} onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                      <div className="qty-val" style={{ fontSize: 12, padding: '0 10px' }}>{item.quantity}</div>
                      <button className="qty-btn" style={{ width: 28, height: 30, fontSize: 14 }} onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ fontSize: 11, color: 'var(--rose)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--ff)' }}>Remove</button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--fm)', alignSelf: 'center' }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ position: 'sticky', top: 70 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Order summary</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span style={{ color: 'var(--teal)', fontWeight: 600 }}>Free</span></div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><span>Tax (5%)</span><span>${tax.toFixed(2)}</span></div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 11, marginTop: 3, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, fontFamily: 'var(--fm)' }}><span>Total</span><span>${finalTotal.toFixed(2)}</span></div>

            <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--gray)' }}>Payment method</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {['mobile_money', 'card', 'bank_transfer', 'cash'].map((m) => (
                <div key={m} onClick={() => setPayMethod(m)}
                  style={{ padding: '7px 8px', border: `1.5px solid ${payMethod === m ? 'var(--indigo)' : 'var(--border)'}`, borderRadius: 8, textAlign: 'center', fontSize: 11, cursor: 'pointer', transition: 'all var(--ease)', fontWeight: 500, color: payMethod === m ? 'var(--indigo)' : 'var(--gray)', background: payMethod === m ? 'var(--indigo-light)' : 'none' }}>
                  {m.replace('_', ' ')}
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-full" style={{ padding: 12, fontSize: 14 }} onClick={handleCheckout} disabled={placing}>
              {placing ? 'Placing order...' : 'Checkout'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--gray)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              🔒 Secure checkout
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Orders.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Orders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    orderAPI.myOrders(filter !== 'all' ? { status: filter } : {})
      .then(({ data }) => { setOrders(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, filter]);

  const STATUS_STYLE = { pending: 'status-pending', confirmed: 'status-confirmed', processing: 'status-processing', delivered: 'status-delivered', cancelled: 'status-cancelled' };
  const TRACK = { pending: 10, confirmed: 35, processing: 65, delivered: 100, cancelled: 0 };

  if (!user) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">Sign in to view orders</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button></div></div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5 }}>My orders</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map((s) => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 40 }}>Loading orders...</div>
        : orders.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No orders yet</div><div className="empty-state-sub">Start shopping to place your first order</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Browse products</button></div>
        : orders.map((o) => (
          <div key={o.id} className="card" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--fm)', color: 'var(--indigo)' }}>#{String(o.id).padStart(4, '0')}</span>
              <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'var(--fm)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
              <span className={`badge ${STATUS_STYLE[o.status] || 'badge-gray'}`} style={{ padding: '3px 10px' }}>{o.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--fm)' }}>${parseFloat(o.total_amount).toFixed(2)}</div>
              <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: o.status === 'cancelled' ? 'var(--rose)' : 'var(--indigo)', width: `${TRACK[o.status] || 0}%`, borderRadius: 2, transition: 'width .5s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>{o.item_count} item{o.item_count !== 1 ? 's' : ''}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

// â”€â”€â”€ OrderDetail.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    orderAPI.get(id)
      .then(({ data }) => { setOrder(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, user]);

  if (!user) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">Sign in to view order details</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button></div></div>;
  if (loading) return <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 40 }}>Loading order...</div>;
  if (!order) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">Order not found</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>Back to orders</button></div></div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5 }}>Order #{String(order.id).padStart(4, '0')}</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>Back</button>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>Status: <b style={{ color: 'var(--ink)' }}>{order.status}</b></div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>Placed: <b style={{ color: 'var(--ink)' }}>{new Date(order.created_at).toLocaleString()}</b></div>
        <div style={{ fontSize: 13, color: 'var(--gray)' }}>Total: <b style={{ color: 'var(--ink)' }}>${parseFloat(order.total_amount || 0).toFixed(2)}</b></div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {(order.items || []).map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, padding: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--surface)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.image ? <img src={toAssetUrl(item.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product_name}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>{item.store_name}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>Qty: {item.quantity} | ${parseFloat(item.unit_price).toFixed(2)} each</div>
              <div style={{ marginTop: 5 }}>
                <span className={`badge status-${item.item_status || 'pending'}`}>{item.item_status || 'pending'}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--fm)' }}>${parseFloat(item.subtotal).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Wishlist.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Wishlist() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggle } = useWishlistStore();

  useEffect(() => {
    if (!user) return;
    wishlistAPI.get().then(({ data }) => { setItems(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const handleRemove = async (productId) => {
    await toggle(productId);
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    toast('Removed from wishlist');
  };

  if (!user) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">♡</div><div className="empty-state-title">Sign in to view wishlist</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button></div></div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 24 }}>
        Wishlist <span style={{ fontFamily: 'var(--fm)', fontSize: 16, color: 'var(--gray)' }}>({items.length})</span>
      </h1>
      {loading ? <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 40 }}>Loading...</div>
        : items.length === 0 ? <div className="empty-state"><div className="empty-state-icon">♡</div><div className="empty-state-title">Nothing saved yet</div><div className="empty-state-sub">Tap ♡ on any product to save it</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Explore products</button></div>
        : <div className="grid-3">{items.map((item) => (
          <div key={item.id} className="card" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }} onClick={() => navigate(`/products/${item.slug}`)}>
            <div style={{ aspectRatio: '4/3', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
              <div className="product-img-pattern" />
              {item.image ? <img src={toAssetUrl(item.image)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ position: 'relative', zIndex: 1 }}>📦</span>}
            </div>
            <div style={{ padding: 13 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--fm)' }}>${parseFloat(item.price).toFixed(2)}</span>
                <button onClick={(e) => { e.stopPropagation(); handleRemove(item.product_id); }}
                  style={{ fontSize: 13, color: 'var(--rose)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>♥ Remove</button>
              </div>
            </div>
          </div>
        ))}</div>}
    </div>
  );
}

export function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-title">Sign in to view profile</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button></div></div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 18 }}>Profile</h1>
      <div className="card">
        <div style={{ fontSize: 13, marginBottom: 6 }}><b>Username:</b> {user.username}</div>
        <div style={{ fontSize: 13, marginBottom: 6 }}><b>Email:</b> {user.email}</div>
        <div style={{ fontSize: 13 }}><b>Role:</b> {user.role}</div>
      </div>
    </div>
  );
}

export function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    parent_id: '',
    icon_url: '',
  });

  const flattenCategories = (nodes = [], depth = 0) =>
    nodes.reduce((acc, node) => {
      acc.push({ ...node, depth });
      if (Array.isArray(node.children) && node.children.length) {
        acc.push(...flattenCategories(node.children, depth + 1));
      }
      return acc;
    }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.list();
      setCategories(flattenCategories(data.data || []));
    } catch {
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadCategories();
  }, [user]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', parent_id: '', icon_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        parent_id: form.parent_id || null,
        icon_url: form.icon_url || null,
      };
      if (editingId) {
        await categoryAPI.update(editingId, payload);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(payload);
        toast.success('Category created');
      }
      await loadCategories();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
      icon_url: category.icon_url || '',
    });
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await categoryAPI.delete(category.id);
      toast.success('Category deleted');
      if (editingId === category.id) resetForm();
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!user || user.role !== 'admin') return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">🛡️</div><div className="empty-state-title">Admin access only</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Go home</button></div></div>;
  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 6 }}>Admin Panel</h1>
      <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 18 }}>Manage categories (full CRUD).</div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        <form className="card" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>{editingId ? 'Edit Category' : 'Create Category'}</h2>
          <div className="form-group">
            <label className="input-label">Category Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="input-label">Parent Category</label>
            <select className="input" value={form.parent_id} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}>
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {`${'  '.repeat(c.depth)}${c.name}`}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">Icon URL (optional)</label>
            <input className="input" value={form.icon_url} onChange={(e) => setForm((f) => ({ ...f, icon_url: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 600 }}>
            Categories ({categories.length})
          </div>
          {loading ? (
            <div style={{ padding: 18, fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-title">No categories yet</div>
              <div className="empty-state-sub">Create your first category from the form.</div>
            </div>
          ) : (
            categories.map((c) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: 12, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{`${'— '.repeat(c.depth)}${c.name}`}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                    slug: {c.slug} | products: {c.product_count || 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" type="button" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn btn-sm btn-rose" type="button" onClick={() => deleteCategory(c)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Dashboard.jsx â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dashboard (seller)
export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState(null);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    status: 'active',
    images: [],
  });

  const flattenCategories = (nodes = []) =>
    nodes.reduce((acc, node) => {
      acc.push(node);
      if (Array.isArray(node.children) && node.children.length) {
        acc.push(...flattenCategories(node.children));
      }
      return acc;
    }, []);

  const loadData = async () => {
    try {
      const [a, p, c] = await Promise.all([
        analyticsAPI.seller(),
        productAPI.mine(),
        categoryAPI.list(),
      ]);
      setAnalytics(a.data.data);
      setProducts(p.data.data || []);
      setCategories(flattenCategories(c.data.data || []));
    } finally {
      setLoading(false);
    }
  };

  const loadSellerOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = orderStatusFilter === 'all' ? {} : { status: orderStatusFilter };
      const { data } = await orderAPI.sellerOrders(params);
      setSellerOrders(data.data || []);
    } catch {
      setSellerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'seller') return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'seller') return;
    loadSellerOrders();
  }, [user, orderStatusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      status: 'active',
      images: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('description', form.description);
      payload.append('price', form.price);
      payload.append('stock', form.stock);
      if (form.category_id) payload.append('category_id', form.category_id);
      payload.append('status', form.status);
      for (const file of form.images) payload.append('images', file);

      if (editingId) {
        await productAPI.update(editingId, payload);
        toast.success('Product updated');
      } else {
        await productAPI.create(payload);
        toast.success('Product created');
      }

      await loadData();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      stock: String(p.stock ?? ''),
      category_id: p.category_id ? String(p.category_id) : '',
      status: p.status || 'active',
      images: [],
    });
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const updateProductService = async (productId, categoryId) => {
    if (!categoryId) return;
    setUpdatingServiceId(productId);
    try {
      const payload = new FormData();
      payload.append('category_id', categoryId);
      await productAPI.update(productId, payload);
      toast.success('Service updated');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update service');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (serviceFilter === 'all') return true;
    if (serviceFilter === 'uncategorized') return !p.category_id;
    return String(p.category_id) === serviceFilter;
  });

  const updateOrderItemStatus = async (orderId, itemId, status) => {
    setUpdatingOrderItemId(itemId);
    try {
      await orderAPI.updateItemStatus(orderId, itemId, status);
      toast.success(`Order item marked ${status}`);
      await loadSellerOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderItemId(null);
    }
  };

  if (!user || user.role !== 'seller') return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">SS</div><div className="empty-state-title">Seller access only</div></div></div>;
  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>Loading seller workspace...</div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 4 }}>Seller Workspace</h1>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>Manage your products and monitor your store performance.</div>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/chat')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Start Chat
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <div className="card-surface"><div style={{ fontSize: 10, color: 'var(--gray)', marginBottom: 4 }}>Revenue</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--fm)' }}>${parseFloat(analytics?.overview?.total_revenue || 0).toFixed(2)}</div></div>
        <div className="card-surface"><div style={{ fontSize: 10, color: 'var(--gray)', marginBottom: 4 }}>Orders</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--fm)' }}>{analytics?.overview?.total_orders || 0}</div></div>
        <div className="card-surface"><div style={{ fontSize: 10, color: 'var(--gray)', marginBottom: 4 }}>Items Sold</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--fm)' }}>{analytics?.overview?.total_items_sold || 0}</div></div>
        <div className="card-surface"><div style={{ fontSize: 10, color: 'var(--gray)', marginBottom: 4 }}>Low Stock</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--fm)' }}>{analytics?.low_stock_count || 0}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Sales Trend</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={analytics?.monthly_sales || []}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => (v || '').slice(5)} />
            <YAxis hide />
            <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <form className="card" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>{editingId ? 'Edit Product' : 'Create Product'}</h2>
          <div className="form-group">
            <label className="input-label">Product Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows="3" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="input-label">Price</label>
              <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="input-label">Stock</label>
              <input className="input" type="number" min="0" required value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="input-label">Service Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                <option value="">{categories.length ? 'Select service/category' : 'General service (no category)'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Images</label>
            <input className="input" type="file" multiple accept="image/*" onChange={(e) => setForm((f) => ({ ...f, images: Array.from(e.target.files || []) }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
            {editingId && (
              <button className="btn btn-ghost" type="button" onClick={resetForm}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>My Products ({filteredProducts.length})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Service Filter</label>
              <select className="input" style={{ minWidth: 180 }} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                <option value="all">All services</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-title">{products.length === 0 ? 'No products yet' : 'No products in this service'}</div>
              <div className="empty-state-sub">{products.length === 0 ? 'Create your first product from the form.' : 'Change the service filter to see other products.'}</div>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 10, alignItems: 'center', padding: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.primary_image ? <img src={toAssetUrl(p.primary_image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '[IMG]'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>{p.category_name || 'Uncategorized'} | ${parseFloat(p.price).toFixed(2)} | stock {p.stock}</div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label className="input-label" style={{ marginBottom: 0, fontSize: 10 }}>Service</label>
                    <select
                      className="input"
                      style={{ width: 180, padding: '6px 10px', fontSize: 11 }}
                      value={p.category_id ? String(p.category_id) : ''}
                      disabled={updatingServiceId === p.id}
                      onChange={(e) => updateProductService(p.id, e.target.value)}
                    >
                      <option value="" disabled>Uncategorized (choose a service)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <span className={`badge ${p.status === 'active' ? 'badge-teal' : 'badge-gray'}`}>{p.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" type="button" onClick={() => editProduct(p)} title="Edit product">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" />
                    </svg>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-rose" type="button" onClick={() => removeProduct(p.id)} title="Delete product">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Order Completion & Payment ({sellerOrders.length})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Order Status</label>
            <select className="input" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        </div>

        {ordersLoading ? (
          <div style={{ padding: 18, fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>Loading seller orders...</div>
        ) : sellerOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-title">No order items found</div>
            <div className="empty-state-sub">When buyers place orders, they will appear here.</div>
          </div>
        ) : (
          sellerOrders.map((item) => (
            <div key={item.id} style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Order #{String(item.order_id).padStart(4, '0')} - {item.product_name}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                  Buyer: {item.buyer_username} | Qty: {item.quantity} | Amount: ${parseFloat(item.subtotal || 0).toFixed(2)} | Payment: {item.payment_status || 'unpaid'}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge status-${item.item_status}`}>{item.item_status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label className="input-label" style={{ marginBottom: 0, fontSize: 10 }}>Set Status</label>
                <select
                  className="input"
                  style={{ minWidth: 150 }}
                  value={item.item_status}
                  disabled={updatingOrderItemId === item.id}
                  onChange={(e) => updateOrderItemStatus(item.order_id, item.id, e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export function Chat() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const socket = getSocket();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const msgsRef = React.useRef(null);

  const loadRooms = async () => {
    try {
      const { data } = await chatAPI.rooms();
      setRooms(data.data || []);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    loadRooms();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;
    socket.on('chat:history', (msgs) => {
      setMessages(msgs);
      loadRooms();
    });
    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      loadRooms();
    });
    socket.on('chat:room', ({ room_id }) => {
      setActiveRoom(room_id);
      setMessages([]);
      socket.emit('chat:join', { room_id });
      loadRooms();
    });
    socket.on('error', (payload) => {
      if (payload?.message) toast.error(payload.message);
    });
    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:room');
      socket.off('error');
    };
  }, [socket, user]);

  useEffect(() => {
    const sellerId = searchParams.get('seller_id');
    if (!socket || !user || user.role !== 'buyer' || !sellerId) return;
    socket.emit('chat:open', { seller_id: Number(sellerId) });
  }, [socket, user, searchParams]);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [messages]);

  const joinRoom = (roomId) => {
    setActiveRoom(roomId);
    setMessages([]);
    socket?.emit('chat:join', { room_id: roomId });
  };

  const sendMsg = () => {
    if (!input.trim() || !activeRoom) return;
    socket?.emit('chat:send', { room_id: activeRoom, body: input.trim() });
    setInput('');
  };

  if (!user) return <div className="container" style={{ paddingTop: 60 }}><div className="empty-state"><div className="empty-state-icon">MSG</div><div className="empty-state-title">Sign in to access messages</div><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>Sign in</button></div></div>;

  return (
    <div className="container fade-up" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <h1 style={{ fontFamily: 'var(--fd)', fontSize: 28, letterSpacing: -0.5, marginBottom: 16 }}>Messages</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', border: '1.5px solid var(--border)', borderRadius: 'var(--rl)', overflow: 'hidden', background: '#fff', height: 480 }}>
        {/* Room list */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <div style={{ padding: '14px 14px 10px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Conversations</div>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => joinRoom(room.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: activeRoom === room.id ? 'var(--surface)' : '#fff',
                borderTop: '1px solid var(--border)',
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: room.unread_count > 0 ? 700 : 600 }}>{room.counterpart_name}</div>
                {room.unread_count > 0 && (
                  <span className="badge badge-rose" style={{ minWidth: 20, justifyContent: 'center' }}>
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.last_message || 'No messages yet'}
              </div>
            </button>
          ))}
          {rooms.length === 0 && <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>No conversations yet.<br/>Start by contacting a seller.</div>}
        </div>

        {/* Chat area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!activeRoom ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--gray)' }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--fm)', color: 'var(--indigo)' }}>MSG</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a conversation</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)' }}>Or contact a seller from a product page</div>
            </div>
          ) : (
            <>
              <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--paper)' }}>
                {messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      {!isMe && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--indigo-light)', color: 'var(--indigo)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.username?.[0]?.toUpperCase()}</div>}
                      <div>
                        <div style={{ padding: '9px 13px', borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px', fontSize: 13, lineHeight: 1.5, background: isMe ? 'var(--indigo)' : '#fff', color: isMe ? '#fff' : 'var(--ink)', border: isMe ? 'none' : '1px solid var(--border)' }}>{m.body}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 3, fontFamily: 'var(--fm)', textAlign: isMe ? 'right' : 'left' }}>{new Date(m.sent_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} placeholder="Type a message..." className="input" style={{ flex: 1, borderRadius: 20 }} />
                <button className="btn btn-primary" style={{ borderRadius: '50%', width: 36, height: 36, padding: 0 }} onClick={sendMsg}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}




