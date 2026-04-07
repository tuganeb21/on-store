import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import styles from './Home.module.css';

const SORT_OPTIONS = [
  { value: 'created_at-DESC', label: 'Newest' },
  { value: 'price-ASC', label: 'Price: Low to High' },
  { value: 'price-DESC', label: 'Price: High to Low' },
  { value: 'avg_rating-DESC', label: 'Top Rated' },
  { value: 'total_sales-DESC', label: 'Best Selling' },
];

const SearchIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const flattenCategories = (nodes = []) =>
  nodes.reduce((all, node) => {
    all.push(node);
    if (Array.isArray(node.children) && node.children.length) {
      all.push(...flattenCategories(node.children));
    }
    return all;
  }, []);

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activecat, setActiveCat] = useState(null);
  const [sort, setSort] = useState('created_at-DESC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const [s, o] = sort.split('-');
    try {
      const { data } = await productAPI.list({
        page, limit: 12, search: search || undefined,
        category: activecat || undefined,
        sort: s, order: o,
        min_price: priceRange.min || undefined,
        max_price: priceRange.max || undefined,
      });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [page, search, activecat, sort, priceRange]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    categoryAPI.list()
      .then(({ data }) => setCategories(flattenCategories(data.data)))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.chip}>
            <span className={styles.chipDot} />
            Curated marketplace · Verified sellers
          </div>
          <h1 className={styles.title}>
            Find what you<br />
            <em className={styles.titleEm}>actually</em> love
          </h1>
          <p className={styles.sub}>
            Great products from verified sellers. No clutter, just quality.
          </p>
          <form className="searchbar" style={{ maxWidth: 500 }} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products, stores, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit"><SearchIcon /></button>
          </form>
        </div>
      </div>

      <div className="container">
        {/* Categories */}
        {categories.length > 0 && (
          <div className={styles.catRow}>
            <div
              className={`${styles.catPill} ${!activecat ? styles.catActive : ''}`}
              onClick={() => { setActiveCat(null); setPage(1); }}
            >
              All
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`${styles.catPill} ${activecat === cat.id ? styles.catActive : ''}`}
                onClick={() => { setActiveCat(cat.id); setPage(1); }}
              >
                {cat.name}
                {cat.product_count > 0 && (
                  <span className={styles.catCount}>{cat.product_count}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.resultCount}>
            {loading ? 'Loading...' : `${pagination.total || 0} products`}
          </div>
          <div className={styles.filters}>
            <div className={styles.priceFilter}>
              <input
                className={styles.priceInput}
                type="number"
                placeholder="Min $"
                value={priceRange.min}
                onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                onBlur={() => setPage(1)}
              />
              <span className={styles.priceSep}>–</span>
              <input
                className={styles.priceInput}
                type="number"
                placeholder="Max $"
                value={priceRange.max}
                onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                onBlur={() => setPage(1)}
              />
            </div>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid-3" style={{ marginBottom: 40 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '4/3', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 14, marginBottom: 8, width: '60%' }} />
                <div className="skeleton" style={{ height: 16 }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No products found</div>
            <div className="empty-state-sub">Try a different search or category</div>
          </div>
        ) : (
          <div className="grid-3" style={{ marginBottom: 32 }}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
