# Parking System - Service Management Application

A full-stack MERN application for managing parking services, cars, payments, and service records.

## Project Overview

This is a modern web application built with:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js (In-memory storage for demo)
- **Authentication**: JWT-based authentication with bcryptjs password hashing

## Features

✅ User Authentication (Login/Logout)
✅ Car Management (Create, Read, Update, Delete)
✅ Service Management (Create, Read, Update, Delete)
✅ Service Records Management
✅ Payment Tracking
✅ Reports & Statistics Dashboard
✅ Responsive UI with Tailwind CSS
✅ Protected Routes with JWT Authentication

## Default Credentials

```
Username: admin
Password: admin 123
```

## Project Structure

```
DAY2/
├── Backend/
│   ├── server.js           # Express server with in-memory database
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables
│   └── models/             # Data model definitions
│
└── Frontend/
    └── Jovan/
        ├── src/
        │   ├── App.jsx              # Main app with routing
        │   ├── index.css            # Global styles
        │   ├── main.jsx             # React entry point
        │   ├── components/
        │   │   └── Navbar.jsx       # Navigation bar
        │   └── pages/
        │       ├── Login.jsx        # Login page
        │       ├── Car.jsx          # Car management
        │       ├── Services.jsx     # Service management
        │       ├── ServiceRecord.jsx # Service records
        │       ├── Payment.jsx      # Payment tracking
        │       └── Reports.jsx      # Statistics dashboard
        ├── package.json
        └── vite.config.js
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd Frontend/Jovan
   npm install
   ```

### Running the Application

#### Terminal 1 - Start Backend Server
```bash
cd Backend
node server.js
```
The backend will run on `http://localhost:5000`

#### Terminal 2 - Start Frontend Development Server
```bash
cd Frontend/Jovan
npm run dev
```
The frontend will run on `http://localhost:5173`

### Access the Application
Open your browser and navigate to: **http://localhost:5173**

Login with:
- Username: `admin`
- Password: `admin 123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Cars
- `GET /api/cars` - Get all cars
- `POST /api/cars` - Add new car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Add new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Service Records
- `GET /api/service-records` - Get all records
- `POST /api/service-records` - Add service record

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment

## Features Description

### 1. Login Page
- Clean, modern login interface with gradient background
- Email validation
- Error handling with user-friendly messages

### 2. Cars Management
- Add new vehicles with plate number and model
- View all registered cars
- Edit car details
- Delete cars from the system

### 3. Services Management
- Add new services with pricing
- View service catalog
- Edit service details and prices
- Remove services

### 4. Service Records
- Record services provided to vehicles
- Track service history
- View service costs

### 5. Payments
- Record payments from customers
- Track payment details (car, amount, receiver)
- View payment history

### 6. Reports Dashboard
- View statistics on:
  - Total cars
  - Total services available
  - Total service records
  - Total payments processed
  - Total revenue generated
  - Average payment amount
- Visual cards with icons
- Summary information

### 7. Navigation Bar
- Clean navigation with all modules
- User information display
- Logout functionality

## Styling

The application uses **Tailwind CSS** for styling with:
- Modern color schemes
- Responsive grid layouts
- Gradient backgrounds
- Smooth transitions and hover effects
- Mobile-friendly design

## Technologies Used

### Frontend
- React 18.2
- React Router DOM 6.23
- Vite 7.2
- Tailwind CSS 3.4
- PostCSS

### Backend
- Express.js 4.19
- bcryptjs 2.4 (password hashing)
- jsonwebtoken 9.0 (JWT authentication)
- CORS enabled

## Notes

- The backend uses in-memory storage for demonstration purposes
- All data will be reset when the server is restarted
- For production, implement MongoDB or another persistent database
- Credentials are hardcoded for demo purposes - use environment variables in production

## Development Tips

1. **Authentication Token**: Stored in localStorage as `token`
2. **User Info**: Username stored in localStorage for display
3. **API Base URL**: All requests go to `http://localhost:5000`
4. **Protected Routes**: Only accessible when logged in
5. **Error Handling**: All forms include error messages

## Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use
- Check Node.js is installed: `node --version`

### Frontend won't load
- Clear browser cache
- Ensure port 5173 is available
- Check console for errors (F12)

### Can't login
- Verify backend is running on port 5000
- Default credentials: admin / admin 123
- Check browser console for error messages

## Future Enhancements

- MongoDB integration for persistent data storage
- User registration system
- Role-based access control
- Payment gateway integration
- Email notifications
- Advanced reporting with charts
- Export data to PDF/Excel
- Multi-language support

## License

This project is created for educational purposes.
