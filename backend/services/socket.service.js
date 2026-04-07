const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.id} (${socket.user.role})`);

    // Join personal notification room
    socket.join(`user:${socket.user.id}`);

    // â”€â”€ JOIN CHAT ROOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    socket.on('chat:join', async ({ room_id }) => {
      try {
        const [room] = await pool.query(
          `SELECT cr.id, b.user_id AS buyer_user_id, s.user_id AS seller_user_id
           FROM chat_rooms cr
           JOIN buyers  b ON cr.buyer_id  = b.id
           JOIN sellers s ON cr.seller_id = s.id
           WHERE cr.id = ?`,
          [room_id]
        );

        if (!room.length) return socket.emit('error', { message: 'Room not found' });

        const r = room[0];
        const allowed = [r.buyer_user_id, r.seller_user_id];
        if (!allowed.includes(socket.user.id)) {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.join(`room:${room_id}`);

        // Load history (last 50 messages)
        const [messages] = await pool.query(
          `SELECT m.id, m.body, m.is_read, m.sent_at, u.username, u.avatar_url, m.sender_id
           FROM messages m JOIN users u ON m.sender_id = u.id
           WHERE m.room_id = ?
           ORDER BY m.sent_at DESC LIMIT 50`,
          [room_id]
        );
        socket.emit('chat:history', messages.reverse());

        // Mark incoming messages as read
        await pool.query(
          'UPDATE messages SET is_read = 1 WHERE room_id = ? AND sender_id != ?',
          [room_id, socket.user.id]
        );
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // â”€â”€ SEND MESSAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    socket.on('chat:send', async ({ room_id, body }) => {
      if (!body?.trim()) return;
      try {
        const [result] = await pool.query(
          'INSERT INTO messages (room_id, sender_id, body) VALUES (?, ?, ?)',
          [room_id, socket.user.id, body.trim()]
        );

        const [msg] = await pool.query(
          `SELECT m.id, m.body, m.is_read, m.sent_at, u.username, u.avatar_url, m.sender_id
           FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
          [result.insertId]
        );

        io.to(`room:${room_id}`).emit('chat:message', msg[0]);

        // Notify the other user
        const [room] = await pool.query(
          `SELECT b.user_id AS buyer_uid, s.user_id AS seller_uid FROM chat_rooms cr
           JOIN buyers b ON cr.buyer_id = b.id JOIN sellers s ON cr.seller_id = s.id WHERE cr.id = ?`,
          [room_id]
        );
        if (room.length) {
          const recipientId = room[0].buyer_uid === socket.user.id
            ? room[0].seller_uid
            : room[0].buyer_uid;

          await pool.query(
            `INSERT INTO notifications (user_id, type, title, body, reference_id) VALUES (?, 'message', 'New message', ?, ?)`,
            [recipientId, `${socket.user.email}: ${body.trim().substring(0, 60)}`, room_id]
          );
          io.to(`user:${recipientId}`).emit('notification:new', {
            type: 'message', title: 'New message', body: body.trim().substring(0, 60),
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // â”€â”€ TYPING INDICATOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    socket.on('chat:typing', ({ room_id, typing }) => {
      socket.to(`room:${room_id}`).emit('chat:typing', {
        user_id: socket.user.id,
        username: socket.user.email,
        typing,
      });
    });

    // â”€â”€ CREATE OR GET CHAT ROOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    socket.on('chat:open', async ({ seller_id }) => {
      try {
        const [buyerRows] = await pool.query('SELECT id FROM buyers WHERE user_id = ?', [socket.user.id]);
        if (!buyerRows.length) return socket.emit('error', { message: 'Buyer profile not found' });

        const buyerId = buyerRows[0].id;
        const [existing] = await pool.query(
          'SELECT id FROM chat_rooms WHERE buyer_id = ? AND seller_id = ?', [buyerId, seller_id]
        );

        let roomId;
        if (existing.length) {
          roomId = existing[0].id;
        } else {
          const [res] = await pool.query(
            'INSERT INTO chat_rooms (buyer_id, seller_id) VALUES (?, ?)', [buyerId, seller_id]
          );
          roomId = res.insertId;
        }

        socket.emit('chat:room', { room_id: roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.id}`);
    });
  });
};

module.exports = { initSocket };

