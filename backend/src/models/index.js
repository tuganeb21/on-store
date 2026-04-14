const db = require('../config/database');
const employeeModel = require('./EmployeeModel');
const leaveRequestModel = require('./LeaveRequestModel');
const leaveBalanceModel = require('./LeaveBalanceModel');

const Employee = employeeModel(db.sequelize);
const LeaveRequest = leaveRequestModel(db.sequelize);
const LeaveBalance = leaveBalanceModel(db.sequelize);

// Set up associations
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

LeaveRequest.belongsTo(Employee, { foreignKey: 'approvedBy', as: 'approver', allowNull: true });

db.Employee = Employee;
db.LeaveRequest = LeaveRequest;
db.LeaveBalance = LeaveBalance;

module.exports = db;
