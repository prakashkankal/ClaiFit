import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Shared/Navbar';

const CustomerOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }
        try {
            const parsedUser = JSON.parse(userInfo);
            setUser(parsedUser);
            fetchOrders(parsedUser._id);
        } catch (error) {
            console.error('Error parsing user info', error);
            navigate('/login');
        }
    }, [navigate]);

    const fetchOrders = async (userId) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/orders/my-orders/${userId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        return `₹${price?.toLocaleString('en-IN') || 0}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Order Completed':
            case 'Completed':
            case 'Delivered':
                return 'bg-emerald-100 text-emerald-700';
            case 'Cutting Completed':
            case 'Stitching':
                return 'bg-blue-100 text-blue-700';
            case 'Order Created':
            case 'Pending':
            case 'In Progress':
                return 'bg-amber-100 text-amber-700';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#faf8f5] pb-24">
            <Navbar showSearchBar={false} />

            <div className="pt-24 px-4 max-w-2xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 font-serif">My Orders</h1>
                    <p className="text-sm text-slate-500">Track your current and past orders</p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B7355]"></div>
                        <p className="mt-4 text-slate-500 text-sm">Loading your orders...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center">
                        <p>{error}</p>
                        <button
                            onClick={() => user && fetchOrders(user._id)}
                            className="mt-2 text-sm underline font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No orders yet</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                            Start exploring tailors near you to place your first order.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-6 py-3 bg-[#8B7355] text-white rounded-full text-sm font-semibold shadow-lg shadow-[#8B7355]/20 active:scale-95 transition-transform"
                        >
                            Explore Tailors
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-tight">
                                            {order.tailorId?.shopName || 'Unknown Shop'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                        {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
                                    </span>
                                </div>

                                <div className="border-t border-dashed border-gray-200 my-3"></div>

                                <div className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Total Amount</p>
                                        <p className="font-bold text-slate-800 text-lg">{formatPrice(order.price)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Items</p>
                                        <p className="font-medium text-slate-700">
                                            {order.orderItems?.length > 0
                                                ? `${order.orderItems.length} Items`
                                                : order.orderType || 'Custom Order'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-mono">ID: {order._id.slice(-6).toUpperCase()}</span>
                                    <button className="text-[#8B7355] text-sm font-semibold flex items-center gap-1">
                                        View Details
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;
