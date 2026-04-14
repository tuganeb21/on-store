const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      employeeId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      department: {
        type: DataTypes.ENUM('HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing'),
        defaultValue: 'IT',
      },
      designation: {
        type: DataTypes.STRING,
        defaultValue: 'Employee',
      },
      salary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      totalLeaveAlloted: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
      },
      role: {
        type: DataTypes.ENUM('employee', 'admin'),
        defaultValue: 'employee',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      joinDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      hooks: {
        beforeCreate: async (employee) => {
          if (employee.password) {
            const salt = await bcrypt.genSalt(10);
            employee.password = await bcrypt.hash(employee.password, salt);
          }
        },
        beforeUpdate: async (employee) => {
          if (employee.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            employee.password = await bcrypt.hash(employee.password, salt);
          }
        },
      },
      timestamps: true,
    }
  );

  Employee.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  return Employee;
};
