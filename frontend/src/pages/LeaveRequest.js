import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LeaveRequest({ token }) {
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        'http://localhost:5000/api/leaves/request',
        formData,
        { headers }
      );

      if (response.data.success) {
        setSuccess('Leave request submitted successfully!');
        setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '50px' }}>
      <div className="card">
        <h2>Request Leave</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="leaveType">Leave Type</label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Explain the reason for your leave request..."
              required
            />
          </div>

          <div className="flex gap-md">
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveRequest;
