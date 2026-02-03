import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import API_URL from '../../config/api'

const Customers = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }
        try {
            const user = JSON.parse(userInfo);
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
                navigate('/');
                return;
            }
            setTailorData(user);
        } catch (error) {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch customers from backend
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!tailorData?._id) return;

            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_URL}/api/orders/customers/${tailorData._id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }

                const data = await response.json();
                setCustomers(data || []);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [tailorData]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const getInitials = (name) => {
        if (!name) return 'C';
        const names = name.split(' ');
        return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    // Calculate stats
    const stats = {
        total: customers.length,
        activeThisMonth: customers.filter(c => {
            const lastVisit = new Date(c.lastVisit);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastVisit >= thirtyDaysAgo;
        }).length,
        newThisWeek: customers.filter(c => {
            const firstVisit = new Date(c.firstVisit);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return firstVisit >= sevenDaysAgo;
        }).length
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format price
    const formatPrice = (price) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Customers 👥</h1>
                    <p className="text-slate-500">Manage your customer relationships</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">Total Customers</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">Active This Month</p>
                        <p className="text-3xl font-bold text-[#6b4423]">{stats.activeThisMonth}</p>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">New This Week</p>
                        <p className="text-3xl font-bold text-emerald-600">{stats.newThisWeek}</p>
                    </div>
                </div>

                {/* Customers Grid */}
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b4423]"></div>
                        <p className="mt-4 text-slate-600">Loading customers...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center bg-white/60 rounded-2xl border border-white/50">
                        <div className="text-red-600 text-lg mb-2">⚠️ Error</div>
                        <p className="text-slate-600">{error}</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-12 text-center bg-white/60 rounded-2xl border border-white/50">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-slate-600 text-lg">No customers yet. Customers will appear here once you start taking orders.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {customers.map((customer, index) => (
                            <div key={index} className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-linear-to-br from-[#6b4423] to-[#8b5a3c] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {getInitials(customer.name)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">{customer.name}</h3>
                                        <p className="text-sm text-slate-600 mb-1">{customer.email || 'No email'}</p>
                                        <p className="text-sm text-slate-600 mb-3">{customer.phone}</p>

                                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                                            <div>
                                                <p className="text-xs text-slate-500">Orders</p>
                                                <p className="text-lg font-bold text-slate-900">{customer.orders}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Total Spent</p>
                                                <p className="text-lg font-bold text-[#6b4423]">{formatPrice(customer.totalSpent)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Last Visit</p>
                                                <p className="text-sm font-medium text-slate-700">{formatDate(customer.lastVisit)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Customers
