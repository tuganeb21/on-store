const { LeaveRequest, LeaveBalance } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_BREAKDOWN = {
  casual: 0,
  sick: 0,
  earned: 0,
  unpaid: 0,
  maternity: 0,
  paternity: 0,
};

const getYearRange = (year) => {
  return {
    startOfYear: new Date(year, 0, 1),
    endOfYear: new Date(year, 11, 31, 23, 59, 59, 999),
  };
};

const getApprovedLeavesForYear = async (employeeId, year) => {
  const { startOfYear, endOfYear } = getYearRange(year);

  return LeaveRequest.findAll({
    where: {
      employeeId,
      status: 'approved',
      startDate: { [Op.lte]: endOfYear },
      endDate: { [Op.gte]: startOfYear },
    },
  });
};

exports.getLeaveUsageSummary = async (employeeId, year) => {
  try {
    const approvedLeaves = await getApprovedLeavesForYear(employeeId, year);
    const breakdown = { ...DEFAULT_BREAKDOWN };
    let totalDaysUsed = 0;

    approvedLeaves.forEach((leave) => {
      const days = Number(leave.numberOfDays) || 0;
      totalDaysUsed += days;
      if (Object.prototype.hasOwnProperty.call(breakdown, leave.leaveType)) {
        breakdown[leave.leaveType] += days;
      }
    });

    return { totalDaysUsed, breakdown };
  } catch (error) {
    console.error('Error getting leave usage summary:', error);
    return {
      totalDaysUsed: 0,
      breakdown: { ...DEFAULT_BREAKDOWN },
    };
  }
};

/**
 * Calculate remaining leave days for an employee in a given year.
 * This function only counts APPROVED leave requests.
 */
exports.calculateRemainingLeave = async (employeeId, year) => {
  try {
    const leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, year },
    });

    if (!leaveBalance) {
      return 0;
    }

    const { totalDaysUsed } = await this.getLeaveUsageSummary(employeeId, year);
    const remaining = leaveBalance.totalLeaveAlloted - totalDaysUsed;
    return Math.max(0, remaining);
  } catch (error) {
    console.error('Error calculating remaining leave:', error);
    return 0;
  }
};

/**
 * Sync LeaveBalance table with live approved-request totals.
 * This protects against stale counters and keeps API values consistent.
 */
exports.syncLeaveBalanceFromApprovedLeaves = async (employeeId, year) => {
  try {
    const leaveBalance = await LeaveBalance.findOne({
      where: { employeeId, year },
    });

    if (!leaveBalance) {
      return null;
    }

    const { totalDaysUsed, breakdown } = await this.getLeaveUsageSummary(employeeId, year);

    leaveBalance.leaveUsed = totalDaysUsed;
    leaveBalance.casualLeaveUsed = breakdown.casual;
    leaveBalance.sickLeaveUsed = breakdown.sick;
    leaveBalance.earnedLeaveUsed = breakdown.earned;
    leaveBalance.unpaidLeaveUsed = breakdown.unpaid;
    leaveBalance.remainingLeave = Math.max(0, leaveBalance.totalLeaveAlloted - totalDaysUsed);

    await leaveBalance.save();
    return leaveBalance;
  } catch (error) {
    console.error('Error syncing leave balance:', error);
    return null;
  }
};

exports.getLeaveBreakdown = async (employeeId, year) => {
  const { breakdown } = await this.getLeaveUsageSummary(employeeId, year);
  return breakdown;
};

exports.hasSufficientLeave = async (employeeId, requiredDays, year) => {
  try {
    const remaining = await this.calculateRemainingLeave(employeeId, year);
    return remaining >= requiredDays;
  } catch (error) {
    console.error('Error checking leave sufficiency:', error);
    return false;
  }
};

exports.getPendingLeaveCount = async () => {
  try {
    return LeaveRequest.count({ where: { status: 'pending' } });
  } catch (error) {
    console.error('Error getting pending leave count:', error);
    return 0;
  }
};

exports.calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

module.exports = exports;
