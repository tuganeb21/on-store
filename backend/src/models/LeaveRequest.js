const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity'],
    required: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date'],
  },
  numberOfDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for leave'],
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  },
  approvalDate: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    maxlength: 500,
    default: null,
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

// Calculate number of days automatically
leaveRequestSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const timeDiff = end.getTime() - start.getTime();
    this.numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
