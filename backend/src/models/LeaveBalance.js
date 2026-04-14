const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true,
  },
  year: {
    type: Number,
    required: true,
  },
  totalLeaveAlloted: {
    type: Number,
    required: true,
    default: 20,
  },
  leaveUsed: {
    type: Number,
    default: 0,
  },
  remainingLeave: {
    type: Number,
    default: 20,
  },
  casualLeaveUsed: {
    type: Number,
    default: 0,
  },
  sickLeaveUsed: {
    type: Number,
    default: 0,
  },
  earnedLeaveUsed: {
    type: Number,
    default: 0,
  },
  unpaidLeaveUsed: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
