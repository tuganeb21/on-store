import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard({ token }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'requests') {
        const response = await axios.get(
          `http://localhost:5000/api/leaves/all?status=${filter}`,
          { headers }
        );
        setLeaveRequests(response.data.data);
      } else {
        const response = await axios.get(
          'http://localhost:5000/api/admin/leave-summary',
          { headers }
        );
        setBalanceSummary(response.data.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveRequestId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `http://localhost:5000/api/admin/leaves/${leaveRequestId}/approve`,
        {},
        { headers }
      );
      setActionMessage('Leave approved successfully!');
      fetchData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError('Failed to approve leave');
    }
  };

  const handleReject = async (leaveRequestId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `http://localhost:5000/api/admin/leaves/${leaveRequestId}/reject`,
        { rejectionReason: reason },
        { headers }
      );
      setActionMessage('Leave rejected successfully!');
      fetchData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError('Failed to reject leave');
    }
  };

  if (loading) return <div className="container mt-lg">Loading...</div>;

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {actionMessage && <div className="alert alert-success">{actionMessage}</div>}

      <div className="flex gap-md mb-lg">
        <button
          className={activeTab === 'requests' ? 'button' : 'button-secondary'}
          onClick={() => {
            setActiveTab('requests');
            setFilter('pending');
            fetchData();
          }}
        >
          Leave Requests
        </button>
        <button
          className={activeTab === 'summary' ? 'button' : 'button-secondary'}
          onClick={() => {
            setActiveTab('summary');
            fetchData();
          }}
        >
          Leave Summary
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header flex-between">
            <h3>Leave Requests</h3>
            <div className="flex gap-md">
              {['pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  className={filter === status ? 'button' : 'button-secondary'}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {leaveRequests.length === 0 ? (
            <p className="text-muted">No {filter} leave requests.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.employee?.name}</td>
                    <td>{request.leaveType}</td>
                    <td>{new Date(request.startDate).toLocaleDateString()}</td>
                    <td>{new Date(request.endDate).toLocaleDateString()}</td>
                    <td>{request.numberOfDays}</td>
                    <td>{request.reason.substring(0, 30)}...</td>
                    <td>
                      <span className={`badge badge-${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === 'pending' && (
                        <div className="flex gap-sm">
                          <button
                            className="button-success"
                            onClick={() => handleApprove(request.id)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Approve
                          </button>
                          <button
                            className="button-danger"
                            onClick={() => handleReject(request.id)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="card">
          <div className="card-header">
            <h3>Employee Leave Summary</h3>
          </div>
          {balanceSummary.length === 0 ? (
            <p className="text-muted">No employees found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Total Leave</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balanceSummary.map((item) => (
                  <tr key={item.employee.id}>
                    <td>{item.employee.name}</td>
                    <td>{item.employee.department}</td>
                    <td>{item.totalLeaveAlloted}</td>
                    <td>{item.leaveUsed}</td>
                    <td>{item.remainingLeave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
