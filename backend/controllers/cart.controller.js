const { pool } = require('../config/db');

const getBuyerId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const buyerId = await getBuyerId(req.user.id);
    if (!buyerId) return res.status(403).json({ success: false, message: 'Buyer profile not found' });

    const [items] = await pool.query(
      `SELECT c.id, c.quantity, c.added_at,
              p.id AS product_id, p.name, p.price, p.stock, p.slug,
              s.store_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN sellers s  ON p.seller_id  = s.id
       WHERE c.buyer_id = ? AND p.status = 'active'`,
      [buyerId]
    );

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, data: items, total: parseFloat(total.toFixed(2)), count: items.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const buyerId = await getBuyerId(req.user.id);
    if (!buyerId) return res.status(403).json({ success: false, message: 'Buyer profile not found' });

    const [product] = await pool.query(
      "SELECT id, stock FROM products WHERE id = ? AND status = 'active'", [product_id]
    );
    if (!product.length) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product[0].stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product[0].stock} items in stock` });
    }

    await pool.query(
      `INSERT INTO cart (buyer_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [buyerId, product_id, quantity]
    );

    res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/cart/:id
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const buyerId = await getBuyerId(req.user.id);

    if (quantity < 1) {
      await pool.query('DELETE FROM cart WHERE id = ? AND buyer_id = ?', [req.params.id, buyerId]);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    const [result] = await pool.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND buyer_id = ?',
      [quantity, req.params.id, buyerId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Cart item not found' });

    res.json({ success: true, message: 'Cart item updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/:id
const removeFromCart = async (req, res, next) => {
  try {
    const buyerId = await getBuyerId(req.user.id);
    await pool.query('DELETE FROM cart WHERE id = ? AND buyer_id = ?', [req.params.id, buyerId]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart  — clear all
const clearCart = async (req, res, next) => {
  try {
    const buyerId = await getBuyerId(req.user.id);
    await pool.query('DELETE FROM cart WHERE buyer_id = ?', [buyerId]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
