const { Op } = require('sequelize');
const { LeaveRequest } = require('../models');

const countWorkingDaysBetween = (startDate, endDate) => {
  let total = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      total++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
};

const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const clampRange = (startA, endA, startB, endB) => {
  const start = startA > startB ? startA : startB;
  const end = endA < endB ? endA : endB;
  if (start > end) return null;
  return { start, end };
};

const getApprovedLeavesForMonth = async (employeeId, year, month) => {
  const { start, end } = getMonthRange(year, month);
  return LeaveRequest.findAll({
    where: {
      employeeId,
      status: 'approved',
      startDate: { [Op.lte]: end },
      endDate: { [Op.gte]: start },
    },
    order: [['startDate', 'ASC']],
  });
};

exports.calculateMonthlyPayroll = async (employee, year, month) => {
  const numericSalary = Number(employee.salary) || 0;
  const { start, end } = getMonthRange(year, month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const workingDaysInMonth = countWorkingDaysBetween(start, end);
  const approvedLeaves = await getApprovedLeavesForMonth(employee.id, year, month);

  let approvedLeaveDays = 0;
  let approvedLeaveWorkingDays = 0;
  let unpaidLeaveWorkingDays = 0;
  let paidLeaveWorkingDays = 0;

  approvedLeaves.forEach((leave) => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const overlap = clampRange(leaveStart, leaveEnd, start, end);

    if (!overlap) {
      return;
    }

    const calendarDays = Math.floor((overlap.end - overlap.start) / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = countWorkingDaysBetween(overlap.start, overlap.end);

    approvedLeaveDays += calendarDays;
    approvedLeaveWorkingDays += workingDays;

    if (leave.leaveType === 'unpaid') {
      unpaidLeaveWorkingDays += workingDays;
    } else {
      paidLeaveWorkingDays += workingDays;
    }
  });

  const presentWorkingDays = Math.max(0, workingDaysInMonth - approvedLeaveWorkingDays);
  const payableWorkingDays = Math.max(0, workingDaysInMonth - unpaidLeaveWorkingDays);
  const perWorkingDayRate = workingDaysInMonth > 0 ? numericSalary / workingDaysInMonth : 0;
  const unpaidLeaveDeduction = unpaidLeaveWorkingDays * perWorkingDayRate;
  const grossPay = numericSalary;
  const netPay = Math.max(0, grossPay - unpaidLeaveDeduction);

  return {
    employee: {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
    },
    period: {
      year,
      month,
      monthLabel: start.toLocaleString('en-US', { month: 'long' }),
      daysInMonth,
      workingDaysInMonth,
    },
    attendance: {
      presentWorkingDays,
      approvedLeaveWorkingDays,
      paidLeaveWorkingDays,
      unpaidLeaveWorkingDays,
      approvedLeaveCalendarDays: approvedLeaveDays,
      payableWorkingDays,
    },
    payroll: {
      basicSalary: Number(numericSalary.toFixed(2)),
      perWorkingDayRate: Number(perWorkingDayRate.toFixed(2)),
      grossPay: Number(grossPay.toFixed(2)),
      unpaidLeaveDeduction: Number(unpaidLeaveDeduction.toFixed(2)),
      netPay: Number(netPay.toFixed(2)),
    },
  };
};

module.exports = exports;
