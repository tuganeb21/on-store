import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'IT',
    designation: 'Employee',
    salary: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/employees/register', formData);

      if (response.data.success) {
        onLogin(response.data.token, response.data.data);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <div className="card">
        <h2 className="text-center">Register</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP001"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <input
                id="designation"
                name="designation"
                type="text"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Job Title"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              id="salary"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-lg">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
