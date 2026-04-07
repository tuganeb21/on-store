const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
const register = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { username, email, password, role, store_name, full_name, phone } = req.body;

    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ? OR username = ?', [email, username]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email or username already taken' });
    }

    const passkey = await bcrypt.hash(password, 12);
    const [result] = await conn.query(
      'INSERT INTO users (username, email, passkey, role) VALUES (?, ?, ?, ?)',
      [username, email, passkey, role || 'buyer']
    );
    const userId = result.insertId;

    if (role === 'seller') {
      if (!store_name) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'store_name is required for sellers' });
      }
      await conn.query(
        'INSERT INTO sellers (user_id, store_name, phone) VALUES (?, ?, ?)',
        [userId, store_name, phone || null]
      );
    } else if ((role || 'buyer') === 'buyer') {
      await conn.query(
        'INSERT INTO buyers (user_id, full_name, phone) VALUES (?, ?, ?)',
        [userId, full_name || null, phone || null]
      );
    }

    await conn.commit();

    const [users] = await conn.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);
    const token = signToken(users[0]);

    res.status(201).json({ success: true, message: 'Account created successfully', token, user: users[0] });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT id, username, email, passkey, role, is_active, avatar_url FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const match = await bcrypt.compare(password, user.passkey);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Attach profile id
    let profileId = null;
    if (user.role === 'seller') {
      const [s] = await pool.query('SELECT id, store_name FROM sellers WHERE user_id = ?', [user.id]);
      profileId = s[0] || null;
    } else if (user.role === 'buyer') {
      const [b] = await pool.query('SELECT id, full_name FROM buyers WHERE user_id = ?', [user.id]);
      profileId = b[0] || null;
    }

    const token = signToken(user);
    const { passkey: _, ...safeUser } = user;

    res.json({ success: true, token, user: safeUser, profile: profileId });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, avatar_url, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT passkey FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].passkey);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET passkey = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
