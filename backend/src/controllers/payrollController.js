const { Employee } = require('../models');
const { calculateMonthlyPayroll } = require('../utils/payrollCalculator');

const parsePeriod = (query) => {
  const now = new Date();
  const year = Number(query.year || now.getFullYear());
  const month = Number(query.month || now.getMonth() + 1);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: 'Year must be a valid number between 2000 and 2100' };
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: 'Month must be a valid number between 1 and 12' };
  }

  return { year, month };
};

exports.getMyMonthlyPayroll = async (req, res) => {
  try {
    const period = parsePeriod(req.query);
    if (period.error) {
      return res.status(400).json({
        success: false,
        message: period.error,
      });
    }

    const employee = await Employee.findByPk(req.user.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const data = await calculateMonthlyPayroll(employee, period.year, period.month);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEmployeeMonthlyPayroll = async (req, res) => {
  try {
    const period = parsePeriod(req.query);
    if (period.error) {
      return res.status(400).json({
        success: false,
        message: period.error,
      });
    }

    const employee = await Employee.findByPk(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const data = await calculateMonthlyPayroll(employee, period.year, period.month);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMonthlyPayrollSummary = async (req, res) => {
  try {
    const period = parsePeriod(req.query);
    if (period.error) {
      return res.status(400).json({
        success: false,
        message: period.error,
      });
    }

    const employees = await Employee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
    });

    const payrollItems = await Promise.all(
      employees.map((employee) => calculateMonthlyPayroll(employee, period.year, period.month))
    );

    const totals = payrollItems.reduce(
      (acc, item) => {
        acc.grossPay += item.payroll.grossPay;
        acc.unpaidLeaveDeduction += item.payroll.unpaidLeaveDeduction;
        acc.netPay += item.payroll.netPay;
        return acc;
      },
      { grossPay: 0, unpaidLeaveDeduction: 0, netPay: 0 }
    );

    return res.status(200).json({
      success: true,
      period: {
        year: period.year,
        month: period.month,
      },
      count: payrollItems.length,
      totals: {
        grossPay: Number(totals.grossPay.toFixed(2)),
        unpaidLeaveDeduction: Number(totals.unpaidLeaveDeduction.toFixed(2)),
        netPay: Number(totals.netPay.toFixed(2)),
      },
      data: payrollItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
