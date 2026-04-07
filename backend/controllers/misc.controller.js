const { pool } = require('../config/db');
const slugify = require('slugify');

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

// POST /api/reviews
const createReview = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { product_id, order_id, rating, title, body } = req.body;

    const [buyerRows] = await conn.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);
    if (!buyerRows.length) return res.status(403).json({ success: false, message: 'Buyer profile not found' });
    const buyerId = buyerRows[0].id;

    // Verify buyer actually purchased this product in this order
    const [purchased] = await conn.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND oi.order_id = ? AND o.buyer_id = ? AND oi.item_status = 'delivered'`,
      [product_id, order_id, buyerId]
    );
    if (!purchased.length) {
      return res.status(403).json({ success: false, message: 'You can only review delivered products you purchased' });
    }

    await conn.query(
      'INSERT INTO reviews (product_id, buyer_id, order_id, rating, title, body) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, buyerId, order_id, rating, title || null, body || null]
    );

    // Update product avg_rating
    const [[avg]] = await conn.query(
      'SELECT AVG(rating) AS avg FROM reviews WHERE product_id = ?', [product_id]
    );
    await conn.query('UPDATE products SET avg_rating = ? WHERE id = ?', [avg.avg.toFixed(2), product_id]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// GET /api/reviews/product/:productId
const getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.body, r.is_verified, r.created_at,
              u.username, u.avatar_url
       FROM reviews r
       JOIN buyers b ON r.buyer_id = b.id
       JOIN users u  ON b.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.productId, parseInt(limit), offset]
    );

    const [[stats]] = await pool.query(
      'SELECT COUNT(*) AS total, AVG(rating) AS avg FROM reviews WHERE product_id = ?',
      [req.params.productId]
    );

    res.json({ success: true, data: reviews, stats: { total: stats.total, avg: parseFloat(stats.avg || 0).toFixed(2) } });
  } catch (err) {
    next(err);
  }
};

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

// GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);
    if (!buyerRows.length) return res.status(403).json({ success: false, message: 'Buyer profile not found' });

    const [items] = await pool.query(
      `SELECT w.id, w.added_at, p.id AS product_id, p.name, p.price, p.avg_rating, p.slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.buyer_id = ?
       ORDER BY w.added_at DESC`,
      [buyerRows[0].id]
    );
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist
const toggleWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);
    if (!buyerRows.length) return res.status(403).json({ success: false, message: 'Buyer profile not found' });
    const buyerId = buyerRows[0].id;

    const [existing] = await pool.query(
      'SELECT id FROM wishlist WHERE buyer_id = ? AND product_id = ?', [buyerId, product_id]
    );

    if (existing.length) {
      await pool.query('DELETE FROM wishlist WHERE buyer_id = ? AND product_id = ?', [buyerId, product_id]);
      return res.json({ success: true, message: 'Removed from wishlist', wishlisted: false });
    }

    await pool.query('INSERT INTO wishlist (buyer_id, product_id) VALUES (?, ?)', [buyerId, product_id]);
    res.status(201).json({ success: true, message: 'Added to wishlist', wishlisted: true });
  } catch (err) {
    next(err);
  }
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon_url, c.parent_id,
              COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
       GROUP BY c.id
       ORDER BY c.parent_id IS NOT NULL, c.name`
    );

    // Build tree structure
    const map = {};
    const tree = [];
    rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
    rows.forEach(r => {
      if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
      else tree.push(map[r.id]);
    });

    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories  (admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, parent_id, icon_url } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, parent_id, icon_url) VALUES (?, ?, ?, ?)',
      [name, slug, parent_id || null, icon_url || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name, slug } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/categories/:id  (admin only)
const updateCategory = async (req, res, next) => {
  try {
    const { name, parent_id, icon_url } = req.body;
    const categoryId = Number(req.params.id);
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }

    const [existing] = await pool.query('SELECT id, name, parent_id, icon_url FROM categories WHERE id = ?', [categoryId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (parent_id && Number(parent_id) === categoryId) {
      return res.status(400).json({ success: false, message: 'Category cannot be its own parent' });
    }

    let nextSlug = null;
    if (name) {
      nextSlug = slugify(name, { lower: true, strict: true });
    }

    const hasParent = Object.prototype.hasOwnProperty.call(req.body, 'parent_id');
    const hasIcon = Object.prototype.hasOwnProperty.call(req.body, 'icon_url');

    await pool.query(
      `UPDATE categories SET
         name = COALESCE(?, name),
         slug = COALESCE(?, slug),
         parent_id = ?,
         icon_url = ?
       WHERE id = ?`,
      [
        name || null,
        nextSlug,
        hasParent ? (parent_id || null) : existing[0].parent_id,
        hasIcon ? (icon_url || null) : existing[0].icon_url,
        categoryId,
      ]
    );

    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id  (admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }

    const [[children]] = await pool.query('SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?', [categoryId]);
    if (children.total > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with subcategories' });
    }

    const [[products]] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE category_id = ?', [categoryId]);
    if (products.total > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category that has products' });
    }

    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'user_id = ?';
    const params = [req.user.id];
    if (unread === 'true') { where += ' AND is_read = 0'; }

    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]
    );

    res.json({ success: true, data: rows, unread_count: count });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// ─── ANALYTICS (seller dashboard) ────────────────────────────────────────────

// GET /api/analytics/seller
const getSellerAnalytics = async (req, res, next) => {
  try {
    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) return res.status(403).json({ success: false, message: 'Seller profile not found' });
    const sellerId = sellerRows[0].id;

    const [[revenue]] = await pool.query(
      `SELECT COALESCE(SUM(oi.subtotal), 0) AS total_revenue,
              COUNT(DISTINCT oi.order_id) AS total_orders,
              SUM(oi.quantity) AS total_items_sold
       FROM order_items oi WHERE oi.seller_id = ? AND oi.item_status != 'cancelled'`,
      [sellerId]
    );

    const [topProducts] = await pool.query(
      `SELECT p.name, p.slug, SUM(oi.quantity) AS units_sold, SUM(oi.subtotal) AS revenue
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.seller_id = ? AND oi.item_status != 'cancelled'
       GROUP BY p.id ORDER BY units_sold DESC LIMIT 5`,
      [sellerId]
    );

    const [monthlySales] = await pool.query(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month,
              SUM(oi.subtotal) AS revenue,
              COUNT(DISTINCT oi.order_id) AS orders
       FROM order_items oi JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND oi.item_status != 'cancelled'
       GROUP BY month ORDER BY month DESC LIMIT 12`,
      [sellerId]
    );

    const [[stockAlert]] = await pool.query(
      'SELECT COUNT(*) AS low_stock FROM products WHERE seller_id = ? AND stock <= 5 AND status = "active"',
      [sellerId]
    );

    res.json({
      success: true,
      data: {
        overview: revenue,
        top_products: topProducts,
        monthly_sales: monthlySales.reverse(),
        low_stock_count: stockAlert.low_stock,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview, getProductReviews,
  getWishlist, toggleWishlist,
  getCategories, createCategory, updateCategory, deleteCategory,
  getNotifications, markAllRead,
  getSellerAnalytics,
};
