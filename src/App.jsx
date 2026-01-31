import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Homepage from './Pages/Homepage'
import TailorRegistration from './Pages/Tailor/TailorRegistration'
import TailorDashboard from './Pages/Tailor/TailorDashboard'
import TailorOrders from './Pages/Tailor/TailorOrders'
import TailorCustomers from './Pages/Tailor/TailorCustomers'
import TailorPortfolio from './Pages/Tailor/TailorPortfolio'
import TailorSettings from './Pages/Tailor/TailorSettings'
import NewOrder from './Pages/Tailor/NewOrder'
import OrderDetailsPage from './Pages/Tailor/OrderDetailsPage'
import MeasurementPresets from './Pages/Tailor/MeasurementPresets'
import Login from './Pages/Login'
import UserRegistration from './Pages/UserRegistration'
import Profile from './Pages/Customer/Profile'
import TailorDetailPage from './Pages/Tailor/TailorDetailPage'
import Navbar from './components/Shared/Navbar'

// Protected Route wrapper for tailor routes
const ProtectedTailorRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userInfo);
    if (user.userType !== 'tailor') {
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

// Component to handle home page with auto-redirect
const HomePageWrapper = () => {
  const userInfo = localStorage.getItem('userInfo');

  if (userInfo) {
    try {
      const user = JSON.parse(userInfo);
      // If tailor is logged in, redirect to dashboard
      if (user.userType === 'tailor') {
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  return <Homepage />;
};

const App = () => {
  return (
    <BrowserRouter>
      <div className='w-full bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen text-slate-900 selection:bg-violet-500/30'>
        {/* Navbar is global, or we can keep it in Homepage if specific. Let's make it global for better navigation */}
        {/* However, the Homepage component includes Navbar already. Let's refactor usage. */}
        {/* For simplicity now, I'll remove Navbar from Homepage internal if I move it here, OR just route pages. */}
        {/* Strategy: Route the entire page components. Homepage keeps its layout. Registration gets its own. */}

        <Routes>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/register" element={<TailorRegistration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<UserRegistration />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tailor/:id" element={
            <>
              <Navbar />
              <TailorDetailPage />
            </>
          } />
          <Route path="/dashboard" element={
            <ProtectedTailorRoute>
              <TailorDashboard />
            </ProtectedTailorRoute>
          } />
          <Route path="/new-order" element={
            <ProtectedTailorRoute>
              <NewOrder />
            </ProtectedTailorRoute>
          } />
          <Route path="/orders" element={
            <ProtectedTailorRoute>
              <TailorOrders />
            </ProtectedTailorRoute>
          } />
          <Route path="/orders/:orderId" element={
            <ProtectedTailorRoute>
              <OrderDetailsPage />
            </ProtectedTailorRoute>
          } />
          <Route path="/dashboard/orders" element={
            <ProtectedTailorRoute>
              <TailorOrders />
            </ProtectedTailorRoute>
          } />
          <Route path="/dashboard/customers" element={
            <ProtectedTailorRoute>
              <TailorCustomers />
            </ProtectedTailorRoute>
          } />
          <Route path="/dashboard/portfolio" element={
            <ProtectedTailorRoute>
              <TailorPortfolio />
            </ProtectedTailorRoute>
          } />
          <Route path="/dashboard/presets" element={
            <ProtectedTailorRoute>
              <MeasurementPresets />
            </ProtectedTailorRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedTailorRoute>
              <TailorSettings />
            </ProtectedTailorRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App