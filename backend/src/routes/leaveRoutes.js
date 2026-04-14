const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const leaveController = require('../controllers/leaveController');

// Get current employee's remaining leave
router.get(
  '/remaining',
  authenticate,
  leaveController.getRemainingLeave
);

// Request leave
router.post(
  '/request',
  authenticate,
  leaveController.requestLeave
);

// Get my leave requests
router.get(
  '/my-requests',
  authenticate,
  leaveController.getMyLeaveRequests
);

// Admin can view all leave requests
router.get(
  '/all',
  authenticate,
  authorize('admin'),
  leaveController.getAllLeaveRequests
);

module.exports = router;
