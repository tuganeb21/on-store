const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define(
    'LeaveRequest',
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
      leaveType: {
        type: DataTypes.ENUM(
          'casual',
          'sick',
          'earned',
          'unpaid',
          'maternity',
          'paternity'
        ),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      numberOfDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Employees',
          key: 'id',
        },
        allowNull: true,
      },
      approvalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return LeaveRequest;
};
