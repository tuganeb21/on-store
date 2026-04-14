const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Approve leave request
router.put(
  '/leaves/:leaveRequestId/approve',
  authenticate,
  authorize('admin'),
  adminController.approveLeave
);

// Reject leave request
router.put(
  '/leaves/:leaveRequestId/reject',
  authenticate,
  authorize('admin'),
  adminController.rejectLeave
);

// Get specific employee's leave balance
router.get(
  '/employees/:employeeId/leave-balance',
  authenticate,
  authorize('admin'),
  adminController.getEmployeeLeaveBalance
);

// Get all employees' leave balance summary
router.get(
  '/leave-summary',
  authenticate,
  authorize('admin'),
  adminController.getLeaveBalanceSummary
);

module.exports = router;
