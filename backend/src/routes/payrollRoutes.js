const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const payrollController = require('../controllers/payrollController');

const router = express.Router();

// Employee payroll details for a month (defaults to current month).
router.get('/my-monthly', authenticate, payrollController.getMyMonthlyPayroll);

// Admin payroll summary for all active employees.
router.get(
  '/monthly-summary',
  authenticate,
  authorize('admin'),
  payrollController.getMonthlyPayrollSummary
);

// Admin payroll details for a specific employee.
router.get(
  '/employee/:employeeId',
  authenticate,
  authorize('admin'),
  payrollController.getEmployeeMonthlyPayroll
);

module.exports = router;
