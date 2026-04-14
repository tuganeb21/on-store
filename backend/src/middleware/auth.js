const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

/**
 * Authentication middleware - validates JWT token
 */
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findByPk(decoded.id);

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Employee not found',
      });
    }

    req.user = {
      id: employee.id,
      role: employee.role,
      email: employee.email,
      name: employee.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

/**
 * Authorization middleware - checks user role
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = exports;
