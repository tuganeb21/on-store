const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide employee name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    enum: ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing'],
    default: 'IT',
  },
  designation: {
    type: String,
    default: 'Employee',
  },
  salary: {
    type: Number,
    required: true,
    default: 0,
  },
  totalLeaveAlloted: {
    type: Number,
    default: 20, // 20 days per year
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  joinDate: {
    type: Date,
    default: Date.now,
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

// Hash password before saving
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
