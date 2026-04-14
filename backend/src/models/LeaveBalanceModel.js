const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveBalance = sequelize.define(
    'LeaveBalance',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Employees',
          key: 'id',
        },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalLeaveAlloted: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
      },
      leaveUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      remainingLeave: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
      },
      casualLeaveUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      sickLeaveUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      earnedLeaveUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      unpaidLeaveUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      uniqueKeys: {
        unique_employee_year: {
          fields: ['employeeId', 'year'],
        },
      },
    }
  );

  return LeaveBalance;
};
