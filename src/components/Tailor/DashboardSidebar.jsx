import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProfileModal from '../Customer/ProfileModal'
import axios from 'axios'

const DashboardSidebar = ({ tailorData, onLogout, onUpdateTailorData }) => {
    const location = useLocation();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            if (!tailorData?._id) return;

            try {
                const { data } = await axios.get(`http://localhost:5000/api/orders/${tailorData._id}`);
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
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/dashboard/orders', icon: '🧵', label: 'All Orders', badge: pendingOrdersCount },
        { path: '/dashboard/customers', icon: '👥', label: 'Customers' },
        { path: '/dashboard/portfolio', icon: '🖼️', label: 'Portfolio' },
        { path: '/dashboard/presets', icon: '📏', label: 'Measurement Presets' },
        { path: '/dashboard/settings', icon: '⚙️', label: 'Settings' }
    ];

    return (
        <>
            <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r-2 border-dashed border-gray-300 p-6 z-40">
                <div className="mb-10 pl-2">
                    <h4 className="text-2xl font-bold text-[#6b4423] font-serif">StyleEase</h4>
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
                    {/* Tailor Profile Card - Click to edit */}
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full bg-amber-50 hover:bg-amber-100 p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#6b4423] flex items-center gap-3 transition-all cursor-pointer group"
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
                            <p className="text-xs text-amber-700 font-medium">Click to edit profile</p>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#6b4423] transition-colors">⚙️</span>
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                tailorData={tailorData}
                onUpdate={onUpdateTailorData}
            />
        </>
    );
};

export default DashboardSidebar;
