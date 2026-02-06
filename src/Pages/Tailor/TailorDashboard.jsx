import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardStats from '../../components/Tailor/DashboardStats'
import RecentOrders from '../../components/Tailor/RecentOrders'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import axios from 'axios'

import API_URL from '../../config/api';

const TailorDashboard = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [dashboardSummary, setDashboardSummary] = useState('');

    useEffect(() => {
        // Get logged-in tailor data from localStorage
        const userInfo = localStorage.getItem('userInfo');

        if (!userInfo) {
            // Not logged in, redirect to login
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userInfo);

            // Check if user is a tailor
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
                // Not a tailor, redirect to home
                navigate('/');
                return;
            }

            setTailorData(user);

            // Fetch summary data
            fetchDashboardSummary(user._id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/login');
        }
    }, [navigate]);

    const fetchDashboardSummary = async (tailorId) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/orders/${tailorId}`);
            const orders = data.orders || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dueToday = orders.filter(order => {
                if (!order.dueDate || order.status === 'Order Completed') return false;
                const dueDate = new Date(order.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime();
            }).length;

            const overdue = orders.filter(order => {
                if (!order.dueDate || order.status === 'Order Completed') return false;
                const dueDate = new Date(order.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() < today.getTime();
            }).length;

            // Build summary text
            let summary = '';
            if (dueToday > 0 || overdue > 0) {
                const parts = [];
                if (dueToday > 0) parts.push(`${dueToday} order${dueToday > 1 ? 's' : ''} due today`);
                if (overdue > 0) parts.push(`${overdue} overdue`);
                summary = parts.join(' • ');
            } else {
                summary = 'No urgent orders today';
            }

            setDashboardSummary(summary);
        } catch (err) {
            console.error('Error fetching dashboard summary:', err);
            setDashboardSummary('Here\'s what\'s happening in your shop today.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    // Get first name from full name
    const getFirstName = (name) => {
        if (!name) return 'Tailor';
        return name.split(' ')[0];
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[100vw] overflow-x-hidden min-h-screen flex bg-[#f5f5f0] text-slate-900">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-3 md:p-6 lg:p-8 dashboard-main-mobile pb-24 md:pb-8">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4 mb-4 md:mb-8 dashboard-header-mobile">
                    <div className="w-full lg:w-auto">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">
                            Welcome back, {getFirstName(tailorData.name)}!
                        </h1>
                        <p className="text-sm md:text-base text-slate-600 font-medium mt-1">{dashboardSummary}</p>
                    </div>

                    {/* New Order Button - Desktop Only */}
                    <button
                        onClick={() => navigate('/new-order')}
                        className="hidden lg:flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] hover:from-[#573619] hover:to-[#6b4423] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Order
                    </button>
                </header>

                <DashboardStats tailorId={tailorData._id} />
                <RecentOrders tailorId={tailorData._id} />
            </main>

            {/* Mobile Floating Action Button (New Order) */}
            <button
                onClick={() => navigate('/new-order')}
                className="lg:hidden fixed bottom-24 md:bottom-28 right-6 w-14 h-14 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-white"
                aria-label="New Order"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    )
}

export default TailorDashboard


