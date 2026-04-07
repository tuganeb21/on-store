const slugify  = require('slugify');
const { pool } = require('../config/db');

// GET /api/products  (public, with filters & pagination)
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, category, seller, min_price,
      max_price, search, sort = 'created_at', order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const allowed = ['created_at', 'price', 'avg_rating', 'total_sales', 'name'];
    const sortCol = allowed.includes(sort) ? sort : 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let where = ["p.status = 'active'"];
    const params = [];

    if (category)  { where.push('p.category_id = ?');          params.push(category); }
    if (seller)    { where.push('p.seller_id = ?');             params.push(seller); }
    if (min_price) { where.push('p.price >= ?');                params.push(min_price); }
    if (max_price) { where.push('p.price <= ?');                params.push(max_price); }
    if (search)    { where.push('p.name LIKE ?');               params.push(`%${search}%`); }

    const whereStr = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock, p.avg_rating, p.total_sales,
              p.created_at, c.name AS category_name, s.store_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN sellers s ON p.seller_id = s.id
       WHERE ${whereStr}
       ORDER BY p.${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p WHERE ${whereStr}`, params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:slug  (public)
const getProduct = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.store_name, s.id AS seller_profile_id, c.name AS category_name,
              u.username AS seller_username
       FROM products p
       LEFT JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN users u   ON s.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.status != 'banned'`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = rows[0];

    const [images] = await pool.query(
      'SELECT id, image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [product.id]
    );

    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at, u.username, u.avatar_url
       FROM reviews r JOIN buyers b ON r.buyer_id = b.id JOIN users u ON b.user_id = u.id
       WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT 10`,
      [product.id]
    );

    const [priceHistory] = await pool.query(
      'SELECT old_price, new_price, changed_at FROM price_history WHERE product_id = ? ORDER BY changed_at DESC LIMIT 5',
      [product.id]
    );

    res.json({ success: true, data: { ...product, images, reviews, priceHistory } });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/mine (seller only)
const getMyProducts = async (req, res, next) => {
  try {
    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) {
      return res.status(403).json({ success: false, message: 'Seller profile not found' });
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock, p.status, p.category_id,
              p.avg_rating, p.total_sales, p.created_at, c.name AS category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ?
       ORDER BY p.created_at DESC`,
      [sellerRows[0].id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (seller only)
const createProduct = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, stock, category_id } = req.body;

    const [sellerRows] = await conn.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) {
      return res.status(403).json({ success: false, message: 'Seller profile not found' });
    }
    const sellerId = sellerRows[0].id;

    let slug = slugify(name, { lower: true, strict: true });
    const [existing] = await conn.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing.length) slug = `${slug}-${Date.now()}`;

    const [result] = await conn.query(
      `INSERT INTO products (seller_id, category_id, name, slug, description, price, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, category_id || null, name, slug, description || null, price, stock || 0]
    );
    const productId = result.insertId;

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map((f, i) => [
        productId,
        `/uploads/products/${f.filename}`,
        i === 0 ? 1 : 0,
        i,
      ]);
      await conn.query(
        'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ?',
        [imageValues]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Product created', data: { id: productId, slug } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// PUT /api/products/:id  (seller only — own products)
const updateProduct = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, stock, category_id, status } = req.body;

    const [sellerRows] = await conn.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) return res.status(403).json({ success: false, message: 'Seller profile not found' });

    const [product] = await conn.query(
      'SELECT id, price FROM products WHERE id = ? AND seller_id = ?',
      [req.params.id, sellerRows[0].id]
    );
    if (!product.length) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

    const old = product[0];

    // Log price change
    if (price && parseFloat(price) !== parseFloat(old.price)) {
      await conn.query(
        'INSERT INTO price_history (product_id, old_price, new_price) VALUES (?, ?, ?)',
        [old.id, old.price, price]
      );
    }

    await conn.query(
      `UPDATE products SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         stock = COALESCE(?, stock),
         category_id = COALESCE(?, category_id),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [name, description, price, stock, category_id, status, old.id]
    );

    await conn.commit();
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// DELETE /api/products/:id  (seller only)
const deleteProduct = async (req, res, next) => {
  try {
    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) return res.status(403).json({ success: false, message: 'Seller profile not found' });

    const [result] = await pool.query(
      'DELETE FROM products WHERE id = ? AND seller_id = ?',
      [req.params.id, sellerRows[0].id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, getMyProducts, createProduct, updateProduct, deleteProduct };
