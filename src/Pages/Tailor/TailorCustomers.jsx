import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import API_URL from '../../config/api'

const TailorCustomers = () => {
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
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900 overflow-x-hidden">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-3 md:p-6 lg:p-8 dashboard-main-mobile min-w-0">
                <header className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-1 md:mb-2">Customers</h1>
                    <p className="text-sm md:text-base text-slate-500">Manage your customer relationships</p>
                </header>

                {/* Stats Cards - Redesigned for Mobile (3-column grid) */}
                <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="hidden md:block text-[#6b4423] mb-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case leading-tight">Total Customers</p>
                        <p className="text-xl md:text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="hidden md:block text-amber-600 mb-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case leading-tight">Active This Month</p>
                        <p className="text-xl md:text-3xl font-bold text-[#6b4423]">{stats.activeThisMonth}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="hidden md:block text-emerald-600 mb-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case leading-tight">New This Week</p>
                        <p className="text-xl md:text-3xl font-bold text-emerald-600">{stats.newThisWeek}</p>
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
                        <div className="text-red-600 text-lg mb-2 flex items-center justify-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Error
                        </div>
                        <p className="text-slate-600">{error}</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <p className="text-slate-800 font-bold text-lg">No customers yet</p>
                        <p className="text-slate-500 text-sm">Customers will appear here once you start taking orders.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-1 px-1">Customers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {customers.map((customer, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md md:hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-3 md:gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-[#6b4423] to-[#8b5a3c] rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shrink-0">
                                            {getInitials(customer.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 md:mb-2 text-wrap">
                                                <div className="min-w-0 flex-1 mr-2">
                                                    <h3 className="text-base md:text-lg font-bold text-slate-800 truncate">{customer.name}</h3>
                                                    <p className="text-xs md:text-sm text-slate-500 truncate">{customer.email || 'No email'}</p>
                                                </div>
                                                <button
                                                    onClick={() => window.location.href = `tel:${customer.phone}`}
                                                    className="p-2 border border-slate-100 rounded-lg text-slate-600 hover:bg-slate-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                </button>
                                            </div>

                                            <p className="text-xs md:text-sm text-slate-600 mb-3 font-medium">{customer.phone}</p>

                                            <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-100 md:border-slate-200">
                                                <div>
                                                    <p className="text-[10px] md:text-xs text-slate-400 md:text-slate-500 uppercase tracking-wide">Orders</p>
                                                    <p className="text-base md:text-lg font-bold text-slate-900">{customer.orders}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] md:text-xs text-slate-400 md:text-slate-500 uppercase tracking-wide">Spent</p>
                                                    <p className="text-base md:text-lg font-bold text-[#6b4423]">{formatPrice(customer.totalSpent)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] md:text-xs text-slate-400 md:text-slate-500 uppercase tracking-wide">Last Visit</p>
                                                    <p className="text-[10px] md:text-sm font-medium text-slate-700">{formatDate(customer.lastVisit)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default TailorCustomers

