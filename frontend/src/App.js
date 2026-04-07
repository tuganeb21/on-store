import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import { ProductDetail, Auth, Cart, Orders, OrderDetail, Wishlist, Dashboard, Chat, Profile, Admin } from './pages/Pages';
import { useAuthStore, useCartStore } from './context/store';
import { initSocket } from './services/socket';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      const me = await fetchMe();
      if (me?.role === 'buyer') {
        fetchCart();
      }
      initSocket(token);
    };

    bootstrap();
  }, [token, fetchMe, fetchCart]);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2400,
          style: {
            background: '#111',
            color: '#fff',
            fontSize: 13,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            borderRadius: 20,
            padding: '10px 18px',
          },
          success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/cart" element={
          <ProtectedRoute roles={['buyer']}><Cart /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute roles={['buyer']}><Orders /></ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute roles={['buyer']}><OrderDetail /></ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute roles={['buyer']}><Wishlist /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['seller']}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
