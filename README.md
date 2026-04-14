# Employee Payroll and Leave Management

Full-stack HR tool with:
- Express + MySQL backend
- React frontend
- JWT authentication
- Leave approval workflow
- Backend-calculated monthly payroll summaries

## Core Features

### Employee
- Register and login
- Submit leave requests (type, dates, reason)
- View leave request history
- View remaining leave days (calculated in backend)
- View monthly payroll breakdown (calculated in backend)

### Admin
- Approve or reject leave requests
- View employee leave summaries
- View monthly payroll summary for all active employees

## Business Logic (Backend)

- Remaining leave is computed from approved leave requests only.
- Leave balances are synchronized before response to prevent stale totals.
- Monthly payroll is computed server-side:
  - Working days in month
  - Approved leave working days
  - Unpaid leave deductions
  - Gross pay and net pay

## Tech Stack

- Backend: Node.js, Express, Sequelize, MySQL
- Frontend: React, React Router, Axios
- Auth: JWT + bcryptjs

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
frontend/
  src/
README.md
```

## Setup

### 1. Create database

Run:

```bash
mysql -u root -p < backend/MIGRATION.sql
```

### 2. Configure backend env

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=employee_payroll_db
DB_PORT=3306
JWT_SECRET=change_me
JWT_EXPIRE=7d
```

### 3. Install dependencies

```bash
npm install
cd frontend && npm install
```

### 4. Run

Backend:

```bash
npm run dev
```

Frontend (new terminal):

```bash
npm run frontend
```

## API Endpoints

### Auth / Employees
- `POST /api/employees/register`
- `POST /api/employees/login`
- `GET /api/employees/profile`
- `GET /api/employees` (admin)

### Leaves
- `POST /api/leaves/request`
- `GET /api/leaves/remaining`
- `GET /api/leaves/my-requests`
- `GET /api/leaves/all` (admin)

### Admin Leave Actions
- `PUT /api/admin/leaves/:leaveRequestId/approve`
- `PUT /api/admin/leaves/:leaveRequestId/reject`
- `GET /api/admin/employees/:employeeId/leave-balance`
- `GET /api/admin/leave-summary`

### Payroll
- `GET /api/payroll/my-monthly?year=2026&month=4`
- `GET /api/payroll/monthly-summary?year=2026&month=4` (admin)
- `GET /api/payroll/employee/:employeeId?year=2026&month=4` (admin)

## Notes

- All calculations required by the frontend are produced by Express before sending responses.
- Use `backend/API_REQUESTS.rest` for quick endpoint testing.
