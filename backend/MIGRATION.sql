
-- Create database
CREATE DATABASE IF NOT EXISTS employee_payroll_db;
USE employee_payroll_db;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  employeeId VARCHAR(50) NOT NULL UNIQUE,
  department ENUM('IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing') NOT NULL,
  designation VARCHAR(100) NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  totalLeaveAlloted INT DEFAULT 20,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_employeeId (employeeId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Leave Requests Table
CREATE TABLE IF NOT EXISTS leaverequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  leaveType ENUM('casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity') NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  numberOfDays INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approvedBy INT,
  approvalDate DATETIME,
  rejectionReason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_employeeId (employeeId),
  INDEX idx_status (status),
  INDEX idx_startDate (startDate),
  INDEX idx_endDate (endDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Leave Balance Table
CREATE TABLE IF NOT EXISTS leavebalances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId INT NOT NULL,
  year INT NOT NULL,
  totalLeaveAlloted INT DEFAULT 20,
  leaveUsed INT DEFAULT 0,
  remainingLeave INT DEFAULT 20,
  casualLeaveUsed INT DEFAULT 0,
  sickLeaveUsed INT DEFAULT 0,
  earnedLeaveUsed INT DEFAULT 0,
  unpaidLeaveUsed INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_year (employeeId, year),
  INDEX idx_employeeId (employeeId),
  INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample admin user (password is bcrypt hashed - you'll need to hash this)
-- For testing, create an admin account through the register endpoint

-- Sample data comments:
-- 1. Register an admin account through the frontend
-- 2. Register multiple employee accounts
-- 3. Employees can submit leave requests
-- 4. Admin approves/rejects requests from the Admin Panel
-- 5. Leave balance is automatically updated on approval

-- Database Configuration Notes:
-- - Database Name: employee_payroll_db
-- - Character Set: utf8mb4 (supports emoji and special characters)
-- - Engine: InnoDB (supports transactions and foreign keys)
-- - Auto-increment for all primary keys
-- - Timestamps are automatically managed by the application

-- Useful Queries for Monitoring:
-- Get all pending leave requests:
-- SELECT lr.*, e.name, e.email FROM leaverequests lr JOIN employees e ON lr.employeeId = e.id WHERE lr.status = 'pending';

-- Get employee leave balance:
-- SELECT * FROM leavebalances WHERE employeeId = ? AND year = YEAR(CURDATE());

-- Get leave usage summary:
-- SELECT e.name, lb.totalLeaveAlloted, lb.leaveUsed, lb.remainingLeave FROM leavebalances lb JOIN employees e ON lb.employeeId = e.id WHERE lb.year = YEAR(CURDATE());
