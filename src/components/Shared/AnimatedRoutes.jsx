import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import RoleSelection from '../../Pages/Auth/RoleSelection';
import Homepage from '../../Pages/Homepage';
import TailorRegistration from '../../Pages/Tailor/TailorRegistration';
import TailorDashboard from '../../Pages/Tailor/TailorDashboard';
import TailorOrders from '../../Pages/Tailor/TailorOrders';
import TailorCustomers from '../../Pages/Tailor/TailorCustomers';
import TailorReviews from '../../Pages/Tailor/TailorReviews';
import TailorPortfolio from '../../Pages/Tailor/TailorPortfolio';
import TailorProfile from '../../Pages/Tailor/TailorProfile';
import TailorSettings from '../../Pages/Tailor/TailorSettings';
import NewOrder from '../../Pages/Tailor/NewOrder';
import OrderDetailsPage from '../../Pages/Tailor/OrderDetailsPage';
import TailorCustomerDetails from '../../Pages/Tailor/TailorCustomerDetails';
import MeasurementPresets from '../../Pages/Tailor/MeasurementPresets';
import TailorNearMe from '../../Pages/Tailor/TailorNearMe';
import Login from '../../Pages/Login';
import UserRegistration from '../../Pages/UserRegistration';
import Profile from '../../Pages/Customer/Profile';
import CustomerOrders from '../../Pages/Customer/CustomerOrders';
import TailorDetailPage from '../../Pages/Tailor/TailorDetailPage';
import PostDetail from '../../Pages/Tailor/PostDetail';
import TailorPostsReel from '../../Pages/Tailor/TailorPostsReel';
import ForgotPassword from '../../Pages/Auth/ForgotPassword';
import ResetPassword from '../../Pages/Auth/ResetPassword';
import VerifyEmail from '../../Pages/Auth/VerifyEmail';
import CheckEmail from '../../Pages/Auth/CheckEmail';
import VerifyOtp from '../../Pages/Auth/VerifyOtp';
import Navbar from '../Shared/Navbar';

// Protected Route wrapper for tailor routes
const ProtectedTailorRoute = ({ children }) => {
    const userInfo = localStorage.getItem('userInfo');

    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userInfo);
        if (user.role !== 'tailor' && user.userType !== 'tailor') {
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
            if (user.role === 'tailor' || user.userType === 'tailor') {
                return <Navigate to="/dashboard" replace />;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }

    return <Homepage />;
};

const AnimatedRoutes = () => {
    const location = useLocation();
    const navType = useNavigationType();

    // Determine animation class based on navigation type
    // PUSH: Slide in from Right (Forward)
    // POP: Slide in from Left (Back)
    // REPLACE: Fade In (Neutral)
    const getAnimationClass = () => {
        switch (navType) {
            case 'PUSH':
                return 'animate-slide-in-right';
            case 'POP':
                return 'animate-slide-in-left';
            default:
                return 'animate-fadeIn';
        }
    };

    return (
        <div key={location.pathname} className={`flex-1 w-full ${getAnimationClass()}`}>
            <Routes location={location}>
                <Route path="/" element={<HomePageWrapper />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
                <Route path="/verify-email/:verificationToken" element={<VerifyEmail />} />
                <Route path="/check-email" element={<CheckEmail />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/signup" element={<RoleSelection />} />
                <Route path="/signup/customer" element={<UserRegistration />} />
                <Route path="/signup/tailor" element={<TailorRegistration />} />
                <Route path="/register" element={<Navigate to="/signup/tailor" replace />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/my-orders" element={<CustomerOrders />} />
                <Route path="/tailor/:id" element={
                    <>
                        <div className="hidden md:block">
                            <Navbar />
                        </div>
                        <TailorDetailPage />
                    </>
                } />
                <Route path="/tailor/:tailorId/posts" element={<TailorPostsReel />} />
                <Route path="/tailor-near-me" element={<TailorNearMe />} />
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
                <Route path="/orders/new" element={
                    <ProtectedTailorRoute>
                        <NewOrder />
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
                <Route path="/dashboard/customers/:phone" element={
                    <ProtectedTailorRoute>
                        <TailorCustomerDetails />
                    </ProtectedTailorRoute>
                } />
                <Route path="/dashboard/reviews" element={
                    <ProtectedTailorRoute>
                        <TailorReviews />
                    </ProtectedTailorRoute>
                } />
                <Route path="/dashboard/portfolio" element={
                    <ProtectedTailorRoute>
                        <TailorPortfolio />
                    </ProtectedTailorRoute>
                } />
                <Route path="/dashboard/profile" element={
                    <ProtectedTailorRoute>
                        <TailorProfile />
                    </ProtectedTailorRoute>
                } />
                <Route path="/dashboard/post/:postId" element={
                    <ProtectedTailorRoute>
                        <PostDetail />
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
    );
};

export default AnimatedRoutes;
