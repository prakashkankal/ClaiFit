import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import API_URL from '../../config/api'

const DashboardSidebar = ({ tailorData, onLogout }) => {
    const location = useLocation();
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const fetchPendingCount = async () => {
            if (!tailorData?._id) return;

            try {
                const { data } = await axios.get(`${API_URL}/api/orders/${tailorData._id}`);
                const orders = data.orders || [];
                const pending = orders.filter(order => order.status !== 'Order Completed').length;
                setPendingOrdersCount(pending);
            } catch (err) {
                console.error('Error fetching pending orders count:', err);
            }
        };

        fetchPendingCount();
        // Refresh count every 30 seconds
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, [tailorData]);

    const getInitials = (name) => {
        if (!name) return 'T';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const navItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        },
        {
            path: '/dashboard/orders',
            label: 'All Orders',
            badge: pendingOrdersCount,
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        },
        {
            path: '/dashboard/customers',
            label: 'Customers',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        },
        {
            path: '/dashboard/reviews',
            label: 'Reviews',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
        },

        {
            path: '/dashboard/presets',
            label: 'Measurement Presets',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
        },
        {
            path: '/dashboard/settings',
            label: 'Settings',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        }
    ];

    return (
        <>
            <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-200 p-6 z-40">
                <div className="mb-10 pl-2">
                    <h4 className="text-3xl font-bold text-[#6b4423]" style={{ fontFamily: '"Playfair Display", serif' }}>KStitch</h4>
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Partner</span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${location.pathname === item.path
                                ? 'bg-[#6b4423] text-white shadow-lg'
                                : 'text-slate-600 hover:bg-amber-50 hover:text-[#6b4423]'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span className="flex-1">{item.label}</span>
                            {item.badge > 0 && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${location.pathname === item.path
                                    ? 'bg-white text-[#6b4423]'
                                    : 'bg-red-500 text-white'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto space-y-3">
                    {/* Tailor Profile Card - Click to view profile */}
                    <Link
                        to="/dashboard/profile"
                        className="w-full bg-amber-50 hover:bg-amber-100 p-4 rounded-2xl border border-slate-200 hover:border-[#6b4423] flex items-center gap-3 transition-all cursor-pointer group shadow-sm"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/50">
                            {tailorData.shopImage ? (
                                <img
                                    src={tailorData.shopImage}
                                    alt="Shop"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-[#6b4423] to-[#8b5a3c] flex items-center justify-center text-white font-bold text-sm">
                                    {getInitials(tailorData.name)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold text-slate-800 truncate">{tailorData.shopName}</p>
                            <p className="text-xs text-amber-700 font-medium">View profile</p>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#6b4423] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                        </span>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Top Navigation Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#6b4423]" style={{ fontFamily: '"Playfair Display", serif' }}>KStitch</h1>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Partner</span>
                </div>
                <button
                    onClick={() => setShowDrawer(true)}
                    className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center px-2 py-2 safe-area-pb shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                {/* 1. Dashboard */}
                <Link to="/dashboard" className={`flex flex-col items-center p-2 rounded-lg ${location.pathname === '/dashboard' ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                    <div className="scale-125">{navItems[0].icon}</div>
                    <span className="text-[10px] font-medium mt-1">Home</span>
                </Link>

                {/* 2. Orders */}
                <Link to="/dashboard/orders" className={`flex flex-col items-center p-2 rounded-lg relative ${location.pathname === '/dashboard/orders' ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                    <div className="scale-125">{navItems[1].icon}</div>
                    <span className="text-[10px] font-medium mt-1">Orders</span>
                    {pendingOrdersCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </Link>

                {/* 3. Customers */}
                <Link to="/dashboard/customers" className={`flex flex-col items-center p-2 rounded-lg ${location.pathname === '/dashboard/customers' ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                    <div className="scale-125">{navItems[2].icon}</div>
                    <span className="text-[10px] font-medium mt-1">Customers</span>
                </Link>

                {/* 4. Reviews */}
                <Link to="/dashboard/reviews" className={`flex flex-col items-center p-2 rounded-lg ${location.pathname === '/dashboard/reviews' ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                    <div className="scale-125">{navItems[3].icon}</div>
                    <span className="text-[10px] font-medium mt-1">Reviews</span>
                </Link>

                {/* 5. Profile */}
                <Link to="/dashboard/profile" className={`flex flex-col items-center p-2 rounded-lg ${location.pathname === '/dashboard/profile' ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                    <div className="scale-125">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="text-[10px] font-medium mt-1">Profile</span>
                </Link>
            </nav>

            {/* Right Side Drawer - Mobile Only */}
            {showDrawer && (
                <>
                    {/* Overlay */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/40 z-50"
                        onClick={() => setShowDrawer(false)}
                    ></div>

                    {/* Drawer Panel */}
                    <div className="lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-60 shadow-2xl animate-slide-in-right">
                        <div className="flex flex-col h-full">
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                                    <button
                                        onClick={() => setShowDrawer(false)}
                                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto py-2">
                                {/* Measurement Presets */}
                                <Link
                                    to="/dashboard/presets"
                                    onClick={() => setShowDrawer(false)}
                                    className="flex items-center gap-4 px-6 py-4 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                    </svg>
                                    <span className="font-medium">Measurement Presets</span>
                                </Link>

                                {/* Settings */}
                                <Link
                                    to="/dashboard/settings"
                                    onClick={() => setShowDrawer(false)}
                                    className="flex items-center gap-4 px-6 py-4 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium">Settings</span>
                                </Link>

                                {/* Divider */}
                                <div className="my-2 border-t border-slate-200"></div>

                                {/* Logout */}
                                <button
                                    onClick={() => {
                                        setShowDrawer(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-down">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Logout?</h3>
                        <p className="text-sm text-slate-600 text-center mb-6">
                            Are you sure you want to logout from your account?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DashboardSidebar;
