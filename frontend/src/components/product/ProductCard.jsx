import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useWishlistStore, useCartStore } from '../../context/store';
import toast from 'react-hot-toast';
import { toAssetUrl } from '../../services/api';
import styles from './ProductCard.module.css';

const TAG_MAP = {
  bestseller: { label: 'Bestseller', cls: styles.tagAmber },
  new: { label: 'New', cls: styles.tagTeal },
  low_stock: { label: 'Low stock', cls: styles.tagRose },
  sale: { label: 'Sale', cls: styles.tagIndigo },
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { addItem } = useCartStore();
  const isBuyer = user?.role === 'buyer';

  const wishlisted = isWishlisted(product.id);

  const handleWish = async (e) => {
    e.stopPropagation();
    if (!isBuyer) { navigate('/auth'); return; }
    await toggle(product.id);
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    if (!isBuyer) { navigate('/auth'); return; }
    try {
      await addItem(product.id, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const tag = product.total_sales > 100
    ? TAG_MAP.bestseller
    : product.stock <= 10 && product.stock > 0
    ? TAG_MAP.low_stock
    : null;

  return (
    <div className={styles.card} onClick={() => navigate(`/products/${product.slug}`)}>
      <div className={styles.imgWrap}>
        <div className={styles.pattern} />
        <div className={styles.emoji}>{product.emoji || '📦'}</div>
        {product.primary_image && (
          <img src={toAssetUrl(product.primary_image)} alt={product.name} className={styles.img} />
        )}
        {tag && <div className={`${styles.tag} ${tag.cls}`}>{tag.label}</div>}
        {isBuyer && (
          <div className={styles.hoverActions}>
            <button className={styles.quickAdd} onClick={handleQuickAdd}>Add to cart</button>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.store}>{product.store_name || product.seller_username}</div>
        <div className={styles.name}>{product.name}</div>
        <div className={styles.bottom}>
          <div className={styles.price}>${parseFloat(product.price).toFixed(2)}</div>
          <div className={styles.right}>
            {product.avg_rating > 0 && (
              <div className={styles.rating}>
                <span className={styles.star}>★</span>
                {parseFloat(product.avg_rating).toFixed(1)}
              </div>
            )}
            {isBuyer && (
              <button
                className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
                onClick={handleWish}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlisted ? '♥' : '♡'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


