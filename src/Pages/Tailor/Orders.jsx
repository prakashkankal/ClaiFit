import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import API_URL from '../../config/api'

const Orders = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('All');

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

    // Fetch orders from backend
    useEffect(() => {
        const fetchOrders = async () => {
            if (!tailorData?._id) return;

            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_URL}/api/orders/${tailorData._id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data.orders || []);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [tailorData]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    // Calculate stats from orders
    const stats = {
        total: orders.length,
        inProgress: orders.filter(o => o.status === 'In Progress').length,
        completed: orders.filter(o => o.status === 'Completed').length,
        pending: orders.filter(o => o.status === 'Pending').length,
    };

    // Filter orders by status
    const filteredOrders = selectedStatus === 'All'
        ? orders
        : orders.filter(order => order.status === selectedStatus);

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

    // Get shortened order ID
    const getShortenedId = (id) => {
        return `ORD-${id.slice(-6).toUpperCase()}`;
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
                    <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Orders</h1>
                    <p className="text-slate-500">Manage all your customer orders</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">Total Orders</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">In Progress</p>
                        <p className="text-3xl font-bold text-[#6b4423]">{stats.inProgress}</p>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">Completed</p>
                        <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-1">Pending</p>
                        <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="mb-6 flex gap-3 flex-wrap">
                    {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStatus === status
                                ? 'bg-[#6b4423] text-white shadow-lg'
                                : 'bg-white text-slate-700 hover:bg-amber-50 border-2 border-dashed border-gray-300'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/50">
                        <h2 className="text-xl font-bold text-slate-800">
                            {selectedStatus === 'All' ? 'All Orders' : `${selectedStatus} Orders`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b4423]"></div>
                            <p className="mt-4 text-slate-600">Loading orders...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="text-red-600 text-lg mb-2 flex items-center justify-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Error
                            </div>
                            <p className="text-slate-600">{error}</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="flex justify-center mb-4">
                                <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-slate-600 text-lg">
                                {selectedStatus === 'All'
                                    ? 'No orders yet. Orders will appear here once customers place them.'
                                    : `No ${selectedStatus.toLowerCase()} orders found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/40">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Order ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Item</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr key={order._id} className="border-t border-white/30 hover:bg-white/20 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {getShortenedId(order._id)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">{order.customerName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{order.customerPhone}</td>
                                            <td className="px-6 py-4 text-sm text-slate-700">{order.orderType}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                                                        order.status === 'Delivered' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                {formatPrice(order.price)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {formatDate(order.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Orders
