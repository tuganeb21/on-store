const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../middleware/auth');
const { Employee } = require('../models');

const router = express.Router();

// Register employee
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, employeeId, department, designation, salary } = req.body;

    if (!name || !email || !password || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingEmail = await Employee.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingEmployeeId = await Employee.findOne({ where: { employeeId } });
    if (existingEmployeeId) {
      return res.status(409).json({
        success: false,
        message: 'Employee ID already registered',
      });
    }

    const employee = await Employee.create({
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      salary,
    });

    const token = jwt.sign(
      { id: employee.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        role: employee.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Login employee
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const employee = await Employee.findOne({ where: { email } });
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordMatch = await employee.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: employee.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get current employee profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        salary: employee.salary,
        totalLeaveAlloted: employee.totalLeaveAlloted,
        joinDate: employee.joinDate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all employees (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await Employee.findAll({
      where: filter,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
