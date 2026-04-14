const { LeaveRequest, Employee, LeaveBalance } = require('../models');
const {
  calculateRemainingLeave,
  syncLeaveBalanceFromApprovedLeaves,
} = require('../utils/leaveCalculator');

// Employee requests leave
exports.requestLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate or endDate',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'endDate must be greater than or equal to startDate',
      });
    }

    // Calculate number of days
    const timeDiff = end.getTime() - start.getTime();
    const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    });

    // Fetch with employee details
    const leaveWithEmployee = await LeaveRequest.findByPk(leaveRequest.id, {
      include: [{ association: 'employee', attributes: ['id', 'name', 'email', 'employeeId', 'department'] }],
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveWithEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get employee's leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const leaveRequests = await LeaveRequest.findAll({
      where: { employeeId },
      include: [{ association: 'employee', attributes: ['id', 'name', 'email'] }],
    });

    return res.status(200).json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get remaining leave days for employee
exports.getRemainingLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Get employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Get or create leave balance for current year
    let leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, year: currentYear },
    });

    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId,
        year: currentYear,
        totalLeaveAlloted: employee.totalLeaveAlloted,
        remainingLeave: employee.totalLeaveAlloted,
      });
    }

    // Sync and calculate from approved leaves to avoid stale data.
    leaveBalance = (await syncLeaveBalanceFromApprovedLeaves(employeeId, currentYear)) || leaveBalance;
    const remainingLeave = await calculateRemainingLeave(employeeId, currentYear);

    return res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        totalLeaveAlloted: leaveBalance.totalLeaveAlloted,
        leaveUsed: Number(leaveBalance.leaveUsed) || 0,
        remainingLeave,
        breakdown: {
          casualLeaveUsed: Number(leaveBalance.casualLeaveUsed) || 0,
          sickLeaveUsed: Number(leaveBalance.sickLeaveUsed) || 0,
          earnedLeaveUsed: Number(leaveBalance.earnedLeaveUsed) || 0,
          unpaidLeaveUsed: Number(leaveBalance.unpaidLeaveUsed) || 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all leave requests (for admin)
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const leaveRequests = await LeaveRequest.findAll({
      where: filter,
      include: [
        { association: 'employee', attributes: ['id', 'name', 'email', 'employeeId', 'department'] },
        { association: 'approver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
