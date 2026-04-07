const { pool } = require('../config/db');

const syncOrderStatus = async (conn, orderId) => {
  const [statsRows] = await conn.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN item_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN item_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
       SUM(CASE WHEN item_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
       SUM(CASE WHEN item_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  const stats = statsRows[0] || {};
  const total = Number(stats.total || 0);
  const pendingCount = Number(stats.pending_count || 0);
  const confirmedCount = Number(stats.confirmed_count || 0);
  const deliveredCount = Number(stats.delivered_count || 0);
  const cancelledCount = Number(stats.cancelled_count || 0);

  let nextStatus = 'pending';
  if (total > 0) {
    if (cancelledCount === total) {
      nextStatus = 'cancelled';
    } else if (deliveredCount + cancelledCount === total && deliveredCount > 0) {
      nextStatus = 'delivered';
    } else if (confirmedCount + cancelledCount === total && confirmedCount > 0) {
      nextStatus = 'confirmed';
    } else if (pendingCount === total) {
      nextStatus = 'pending';
    } else {
      nextStatus = 'processing';
    }
  }

  await conn.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
  return nextStatus;
};

// POST /api/orders  — buyer places order from cart
const placeOrder = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { address_id, payment_method, notes } = req.body;

    const [buyerRows] = await conn.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);
    if (!buyerRows.length) return res.status(403).json({ success: false, message: 'Buyer profile not found' });
    const buyerId = buyerRows[0].id;

    // Fetch cart items with product details
    const [cartItems] = await conn.query(
      `SELECT c.quantity, p.id AS product_id, p.price, p.stock, p.name, p.seller_id
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.buyer_id = ? AND p.status = 'active'`,
      [buyerId]
    );
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Available: ${item.stock}`,
        });
      }
    }

    const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const [orderResult] = await conn.query(
      `INSERT INTO orders (buyer_id, address_id, total_amount, payment_method, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [buyerId, address_id || null, totalAmount, payment_method || null, notes || null]
    );
    const orderId = orderResult.insertId;

    // Insert order items & decrement stock
    for (const item of cartItems) {
      const subtotal = item.price * item.quantity;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.seller_id, item.quantity, item.price, subtotal]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ?, total_sales = total_sales + ? WHERE id = ?',
        [item.quantity, item.quantity, item.product_id]
      );
    }

    // Clear cart
    await conn.query('DELETE FROM cart WHERE buyer_id = ?', [buyerId]);

    // Create notification for buyer
    await conn.query(
      `INSERT INTO notifications (user_id, type, title, body, reference_id)
       VALUES (?, 'order_placed', 'Order placed!', ?, ?)`,
      [req.user.id, `Your order #${orderId} has been placed successfully.`, orderId]
    );

    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed successfully', data: { orderId, totalAmount } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// GET /api/orders  — buyer's order history
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);
    if (!buyerRows.length) return res.status(403).json({ success: false, message: 'Buyer profile not found' });

    let where = 'o.buyer_id = ?';
    const params = [buyerRows[0].id];
    if (status) { where += ' AND o.status = ?'; params.push(status); }

    const [orders] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.payment_status, o.payment_method, o.created_at,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id — order detail
const getOrder = async (req, res, next) => {
  try {
    const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);

    const [orders] = await pool.query(
      `SELECT o.*, a.street, a.city, a.country, a.label AS address_label
       FROM orders o LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = ? AND o.buyer_id = ?`,
      [req.params.id, buyerRows[0]?.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.slug AS product_slug, s.store_name,
              (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN sellers s  ON oi.seller_id  = s.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/seller  — seller sees their order items
const getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) return res.status(403).json({ success: false, message: 'Seller profile not found' });

    let where = 'oi.seller_id = ?';
    const params = [sellerRows[0].id];
    if (status) { where += ' AND oi.item_status = ?'; params.push(status); }

    const [items] = await pool.query(
      `SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal, oi.item_status,
              o.id AS order_id, o.created_at, o.payment_status,
              p.name AS product_name, p.slug,
              u.username AS buyer_username
       FROM order_items oi
       JOIN orders o  ON oi.order_id  = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN buyers b  ON o.buyer_id    = b.id
       JOIN users u   ON b.user_id     = u.id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:orderId/items/:itemId/status  — seller updates item status
const updateItemStatus = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const [sellerRows] = await conn.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows.length) return res.status(403).json({ success: false, message: 'Seller profile not found' });

    const [item] = await conn.query(
      'SELECT oi.id, oi.order_id, o.buyer_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.id = ? AND oi.seller_id = ?',
      [req.params.itemId, sellerRows[0].id]
    );
    if (!item.length) return res.status(404).json({ success: false, message: 'Order item not found' });

    await conn.query('UPDATE order_items SET item_status = ? WHERE id = ?', [status, req.params.itemId]);
    const orderStatus = await syncOrderStatus(conn, item[0].order_id);

    // Notify buyer
    const [buyer] = await conn.query('SELECT user_id FROM buyers WHERE id = ?', [item[0].buyer_id]);
    await conn.query(
      `INSERT INTO notifications (user_id, type, title, body, reference_id) VALUES (?, 'order_update', ?, ?, ?)`,
      [buyer[0].user_id, `Order item status updated`, `Item in order #${item[0].order_id} is now: ${status}`, item[0].order_id]
    );

    await conn.commit();
    res.json({ success: true, message: 'Item status updated', data: { status, order_status: orderStatus } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// PATCH /api/orders/:id/cancel  — buyer cancels order
const cancelOrder = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [buyerRows] = await conn.query('SELECT id FROM buyers WHERE user_id = ?', [req.user.id]);

    const [orders] = await conn.query(
      'SELECT id, status FROM orders WHERE id = ? AND buyer_id = ?',
      [req.params.id, buyerRows[0]?.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(orders[0].status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    await conn.query("UPDATE order_items SET item_status = 'cancelled' WHERE order_id = ?", [req.params.id]);

    // Restore stock
    const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

module.exports = { placeOrder, getMyOrders, getOrder, getSellerOrders, updateItemStatus, cancelOrder };
