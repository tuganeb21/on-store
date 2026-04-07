const { pool } = require('../config/db');

// GET /api/chat/rooms
const getMyRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let rows = [];

    if (role === 'buyer') {
      const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [userId]);
      if (!buyerRows.length) {
        return res.json({ success: true, data: [] });
      }

      const buyerId = buyerRows[0].id;
      const [data] = await pool.query(
        `SELECT cr.id,
                s.id AS seller_id,
                su.username AS counterpart_name,
                (SELECT m.body FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
                (SELECT m.sent_at FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*)
                 FROM messages m
                 WHERE m.room_id = cr.id
                   AND m.sender_id != ?
                   AND m.is_read = 0) AS unread_count
         FROM chat_rooms cr
         JOIN sellers s ON cr.seller_id = s.id
         JOIN users su ON s.user_id = su.id
         WHERE cr.buyer_id = ?
         ORDER BY last_message_at DESC, cr.created_at DESC`,
        [userId, buyerId]
      );
      rows = data;
    } else if (role === 'seller') {
      const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [userId]);
      if (!sellerRows.length) {
        return res.json({ success: true, data: [] });
      }

      const sellerId = sellerRows[0].id;
      const [data] = await pool.query(
        `SELECT cr.id,
                b.id AS buyer_id,
                bu.username AS counterpart_name,
                (SELECT m.body FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
                (SELECT m.sent_at FROM messages m WHERE m.room_id = cr.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*)
                 FROM messages m
                 WHERE m.room_id = cr.id
                   AND m.sender_id != ?
                   AND m.is_read = 0) AS unread_count
         FROM chat_rooms cr
         JOIN buyers b ON cr.buyer_id = b.id
         JOIN users bu ON b.user_id = bu.id
         WHERE cr.seller_id = ?
         ORDER BY last_message_at DESC, cr.created_at DESC`,
        [userId, sellerId]
      );
      rows = data;
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyRooms };
