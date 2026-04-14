import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, onLogout }) {
  return (
    <header>
      <div className="container flex-between">
        <h1>Leave Management</h1>
        <nav className="flex gap-md">
          {user && (
            <>
              <span className="text-muted">Welcome, {user.name}</span>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/request-leave">Request Leave</Link>
              {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
              <button
                className="button-secondary"
                onClick={onLogout}
                style={{ padding: '8px 16px', display: 'inline-block', border: '2px solid white' }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
