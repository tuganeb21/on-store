const { LeaveRequest, Employee, LeaveBalance } = require('../models');
const {
  calculateRemainingLeave,
  hasSufficientLeave,
  syncLeaveBalanceFromApprovedLeaves,
} = require('../utils/leaveCalculator');

// Admin approves leave request
exports.approveLeave = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const adminId = req.user.id;

    // Find leave request
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId, {
      include: [{ association: 'employee' }],
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${leaveRequest.status} leave request`,
      });
    }

    const leaveYear = new Date(leaveRequest.startDate).getFullYear();
    const isPaidLeave = leaveRequest.leaveType !== 'unpaid';

    if (isPaidLeave) {
      const enoughLeave = await hasSufficientLeave(
        leaveRequest.employeeId,
        leaveRequest.numberOfDays,
        leaveYear
      );

      if (!enoughLeave) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient remaining leave days for this approval',
        });
      }
    }

    // Update leave request status
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = adminId;
    leaveRequest.approvalDate = new Date();
    await leaveRequest.save();

    // Update leave balance
    let leaveBalance = await LeaveBalance.findOne({
      where: { employeeId: leaveRequest.employeeId, year: leaveYear },
    });

    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        employeeId: leaveRequest.employeeId,
        year: leaveYear,
        totalLeaveAlloted: leaveRequest.employee.totalLeaveAlloted,
      });
    }
    leaveBalance =
      (await syncLeaveBalanceFromApprovedLeaves(leaveRequest.employeeId, leaveYear)) || leaveBalance;

    // Fetch updated data
    const updatedRequest = await LeaveRequest.findByPk(leaveRequestId, {
      include: [{ association: 'employee', attributes: ['id', 'name', 'email', 'department'] }],
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: {
        leaveRequest: updatedRequest,
        updatedLeaveBalance: {
          year: leaveYear,
          totalLeaveAlloted: leaveBalance.totalLeaveAlloted,
          leaveUsed: Number(leaveBalance.leaveUsed) || 0,
          remainingLeave: Number(leaveBalance.remainingLeave) || 0,
          breakdown: {
            casualLeaveUsed: Number(leaveBalance.casualLeaveUsed) || 0,
            sickLeaveUsed: Number(leaveBalance.sickLeaveUsed) || 0,
            earnedLeaveUsed: Number(leaveBalance.earnedLeaveUsed) || 0,
            unpaidLeaveUsed: Number(leaveBalance.unpaidLeaveUsed) || 0,
          },
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

// Admin rejects leave request
exports.rejectLeave = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rejection reason',
      });
    }

    // Find leave request
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId, {
      include: [{ association: 'employee' }],
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${leaveRequest.status} leave request`,
      });
    }

    // Update leave request status
    leaveRequest.status = 'rejected';
    leaveRequest.approvedBy = adminId;
    leaveRequest.rejectionReason = rejectionReason;
    leaveRequest.approvalDate = new Date();
    await leaveRequest.save();

    const updatedRequest = await LeaveRequest.findByPk(leaveRequestId, {
      include: [{ association: 'employee', attributes: ['id', 'name', 'email', 'department'] }],
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get employee's leave balance
exports.getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const currentYear = new Date().getFullYear();

    // Get employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Get leave balance
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

    leaveBalance = (await syncLeaveBalanceFromApprovedLeaves(employeeId, currentYear)) || leaveBalance;
    const remainingLeave = await calculateRemainingLeave(employeeId, currentYear);

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          employeeId: employee.employeeId,
          department: employee.department,
        },
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

// Get all employees' leave balance summary
exports.getLeaveBalanceSummary = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get all employees
    const employees = await Employee.findAll({
      where: { status: 'active' },
    });

    // Build summary for each employee
    const balanceSummary = await Promise.all(
      employees.map(async (emp) => {
        let leaveBalance = await LeaveBalance.findOne({
          where: { employeeId: emp.id, year: currentYear },
        });
        leaveBalance = (await syncLeaveBalanceFromApprovedLeaves(emp.id, currentYear)) || leaveBalance;

        const remainingLeave = await calculateRemainingLeave(emp.id, currentYear);

        return {
          employee: {
            id: emp.id,
            name: emp.name,
            employeeId: emp.employeeId,
            department: emp.department,
          },
          totalLeaveAlloted: leaveBalance?.totalLeaveAlloted || emp.totalLeaveAlloted,
          leaveUsed: Number(leaveBalance?.leaveUsed) || 0,
          remainingLeave,
        };
      })
    );

    return res.status(200).json({
      success: true,
      year: currentYear,
      count: balanceSummary.length,
      data: balanceSummary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
