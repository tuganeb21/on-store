import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ token, user }) {
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const balanceResponse = await axios.get(
        'http://localhost:5000/api/leaves/remaining',
        { headers }
      );
      setLeaveBalance(balanceResponse.data.data);

      const requestsResponse = await axios.get(
        'http://localhost:5000/api/leaves/my-requests',
        { headers }
      );
      setLeaveRequests(requestsResponse.data.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mt-lg">Loading...</div>;

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {leaveBalance && (
        <div className="grid-2 mb-lg">
          <div className="card">
            <div className="card-header">
              <h3>Leave Balance</h3>
            </div>
            <div className="grid-3">
              <div>
                <p className="text-muted">Total Leave</p>
                <h2>{leaveBalance.totalLeaveAlloted}</h2>
              </div>
              <div>
                <p className="text-muted">Used</p>
                <h2>{leaveBalance.leaveUsed}</h2>
              </div>
              <div>
                <p className="text-muted">Remaining</p>
                <h2>{leaveBalance.remainingLeave}</h2>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Leave Breakdown</h3>
            </div>
            <table>
              <tbody>
                <tr>
                  <td>Casual Leave</td>
                  <td className="text-right">{leaveBalance.breakdown.casualLeaveUsed}</td>
                </tr>
                <tr>
                  <td>Sick Leave</td>
                  <td className="text-right">{leaveBalance.breakdown.sickLeaveUsed}</td>
                </tr>
                <tr>
                  <td>Earned Leave</td>
                  <td className="text-right">{leaveBalance.breakdown.earnedLeaveUsed}</td>
                </tr>
                <tr>
                  <td>Unpaid Leave</td>
                  <td className="text-right">{leaveBalance.breakdown.unpaidLeaveUsed}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Your Leave Requests</h3>
        </div>
        {leaveRequests.length === 0 ? (
          <p className="text-muted">No leave requests yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.leaveType}</td>
                  <td>{new Date(request.startDate).toLocaleDateString()}</td>
                  <td>{new Date(request.endDate).toLocaleDateString()}</td>
                  <td>{request.numberOfDays}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        request.status === 'approved'
                          ? 'success'
                          : request.status === 'rejected'
                          ? 'error'
                          : 'warning'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>{request.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
