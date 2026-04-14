const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sync database
db.sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((err) => {
    console.log('Error syncing database:', err.message);
  });

// Routes
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
