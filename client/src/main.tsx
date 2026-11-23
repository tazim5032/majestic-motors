import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { SiteLayout } from './components/Layout';
import { DashboardLayout, RequireAuth } from './components/DashboardLayout';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import CarDetails from './pages/CarDetails';
import About from './pages/About';
import { Login, Register } from './pages/Auth';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import NotFound from './pages/NotFound';
import { MyOrders, Profile, UserOverview } from './pages/dashboard/UserPages';
import { AdminCars, AdminOrders, AdminOverview, AdminUsers } from './pages/dashboard/AdminPages';

function DashboardHome() {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: '/dashboard' }} />;
  return <Navigate to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="cars" element={<Inventory />} />
              <Route path="cars/:id" element={<CarDetails />} />
              <Route path="about" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="checkout/:carId" element={<RequireAuth role="user"><Checkout /></RequireAuth>} />
              <Route path="pay/:paymentId" element={<RequireAuth><Payment /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="dashboard/user" element={<RequireAuth role="user"><DashboardLayout role="user" /></RequireAuth>}>
              <Route index element={<UserOverview />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="dashboard/admin" element={<RequireAuth role="admin"><DashboardLayout role="admin" /></RequireAuth>}>
              <Route index element={<AdminOverview />} />
              <Route path="cars" element={<AdminCars />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
